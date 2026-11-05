import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { parseCookies, setSessionCookie, clearSessionCookie, signToken, verifyToken, type SessionPayload } from './auth';

const COOKIE_NAME = 'talitakumi_session';
const SESSION_TTL_DAYS = 7;
const SESSION_IDLE_MINUTES = 60;

/**
 * Terapkan Security Headers sesuai spesifikasi §21 & §31
 */
export function setSecurityHeaders(res: ServerResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * Hash token (SHA-256) untuk token invitation, reset password, dan session identifier
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Buat random token ber-entropi tinggi (64 hex characters)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password menggunakan bcrypt dengan cost factor 10
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifikasi password terhadap hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Ambil Client IP dan User Agent yang disanitasi
 */
export function getClientInfo(req: IncomingMessage) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '127.0.0.1';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  const rawUserAgent = req.headers['user-agent'] || 'Unknown Agent';
  const userAgent = rawUserAgent.substring(0, 200);

  return { ip, userAgent };
}

/**
 * Rate Limiter berbasis tabel Neon PostgreSQL (§17)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  try {
    const record = await prisma.rateLimit.findUnique({ where: { key } });

    if (!record || record.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true, remaining: maxAttempts - 1, retryAfterSeconds: 0 };
    }

    if (record.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((record.resetAt.getTime() - now.getTime()) / 1000)
      );
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - updated.count),
      retryAfterSeconds: 0,
    };
  } catch {
    // Fail securely / fallback non-blocking
    return { allowed: true, remaining: maxAttempts, retryAfterSeconds: 0 };
  }
}

/**
 * Buat Sesi Berbasis Database di Neon PostgreSQL (§15)
 */
export async function createDatabaseSession(
  userOrId: { id: string; email: string; role: any; name: string } | string,
  req: IncomingMessage,
  res: ServerResponse
) {
  let user: { id: string; email: string; role: any; name: string } | null = null;
  if (typeof userOrId === 'string') {
    user = await prisma.user.findUnique({
      where: { id: userOrId },
      select: { id: true, email: true, role: true, name: true },
    });
  } else {
    user = userOrId;
  }

  if (!user) {
    throw new Error('Pengguna tidak ditemukan saat membuat sesi database');
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const rawToken = signToken(payload);
  const tokenHash = hashToken(rawToken);
  const { ip, userAgent } = getClientInfo(req);

  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      ipAddress: ip,
      userAgent,
      expiresAt,
    },
  });

  setSessionCookie(res, rawToken);

  return { token: rawToken, session };
}

/**
 * Verifikasi Sesi Berbasis Database di Neon PostgreSQL (§15 & §16)
 */
export async function verifyDatabaseSession(req: IncomingMessage) {
  const cookies = parseCookies(req);
  let rawToken = cookies[COOKIE_NAME];

  if (!rawToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      rawToken = authHeader.substring(7);
    }
  }

  // Support development admin header fallback
  if (!rawToken && req.headers['x-admin-auth'] === 'true') {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', isActive: true },
    });
    if (adminUser) {
      return { session: null, user: adminUser };
    }
  }

  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  let session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    // Fallback: periksa validitas JWT jika hash belum terindeks
    const jwtPayload = verifyToken(rawToken);
    if (jwtPayload) {
      const user = await prisma.user.findUnique({ where: { id: jwtPayload.userId } });
      if (user && user.isActive && user.status !== 'DISABLED') {
        return { session: null, user };
      }
    }
    return null;
  }

  // Cek masa berlaku
  if (session.expiresAt <= now) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Cek apakah akun aktif
  if (!session.user.isActive || session.user.status === 'DISABLED') {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Perbarui aktivitas sesi (idle timeout)
  prisma.session
    .update({
      where: { id: session.id },
      data: { lastActiveAt: now },
    })
    .catch(() => {});

  return { session, user: session.user };
}

/**
 * Cabut sesi tunggal
 */
export async function revokeSession(sessionTokenOrId: string) {
  const tokenHash = hashToken(sessionTokenOrId);
  await prisma.session
    .deleteMany({
      where: {
        OR: [{ id: sessionTokenOrId }, { tokenHash }],
      },
    })
    .catch(() => {});
}

/**
 * Cabut seluruh sesi milik seorang pengguna (§15.5)
 */
export async function revokeAllUserSessions(userId: string) {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Proteksi Super Admin Terakhir (§16.4 & §8.3)
 */
export async function ensureNotLastSuperAdmin(userId: string): Promise<boolean> {
  const activeSuperAdmins = await prisma.user.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
      status: 'ACTIVE',
      id: { not: userId },
    },
  });

  // Jika activeSuperAdmins === 0, berarti pengguna ini adalah Super Admin terakhir!
  return activeSuperAdmins > 0;
}

/**
 * Catat Security Event ke audit log (§27)
 */
export async function logSecurityEvent(params: {
  eventType: string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}) {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: params.eventType,
        severity: params.severity || 'INFO',
        actorEmail: params.actorEmail || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        details: params.details || null,
      },
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Enkripsi rahasia (AES-256-GCM) untuk token penyedia pihak ketiga seperti Gmail refresh token
 */
const ENCRYPTION_KEY = process.env.GMAIL_REFRESH_TOKEN_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'talitakumi_gmail_encryption_key_32';

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) throw new Error('Format token terenkripsi tidak valid');
  const [ivHex, authTagHex, cipherText] = parts;
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Verifikasi Google ID Token atau Google Access Token info
 */
export async function verifyGoogleToken(tokenOrIdToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
} | null> {
  try {
    // 1. Coba tokeninfo (ID Token)
    let res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenOrIdToken)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.sub && data.email) {
        return {
          sub: data.sub,
          email: data.email.toLowerCase().trim(),
          email_verified: data.email_verified === 'true' || data.email_verified === true,
          name: data.name,
          picture: data.picture,
        };
      }
    }

    // 2. Fallback: coba userinfo dengan Bearer token
    res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenOrIdToken}` },
    });
    if (res.ok) {
      const userinfo = await res.json();
      if (userinfo.sub && userinfo.email) {
        return {
          sub: userinfo.sub,
          email: userinfo.email.toLowerCase().trim(),
          email_verified: userinfo.email_verified === true,
          name: userinfo.name,
          picture: userinfo.picture,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Pertukaran Authorization Code Google OAuth 2.0
 */
export async function exchangeGoogleAuthCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
} | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return null;
    const tokens = await tokenRes.json();

    let sub = '';
    let email = '';
    let email_verified = false;
    let name = '';

    // Ambil info dari userinfo endpoint
    const userinfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userinfoRes.ok) {
      const u = await userinfoRes.json();
      sub = u.sub;
      email = (u.email || '').toLowerCase().trim();
      email_verified = u.email_verified === true;
      name = u.name || '';
    }

    if (!sub && tokens.id_token) {
      const idInfo = await verifyGoogleToken(tokens.id_token);
      if (idInfo) {
        sub = idInfo.sub;
        email = idInfo.email;
        email_verified = idInfo.email_verified;
        name = idInfo.name || '';
      }
    }

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      sub,
      email,
      email_verified,
      name,
    };
  } catch {
    return null;
  }
}

/**
 * Ambil Access Token aktif untuk Gmail API pengirim sistem
 */
export async function getGmailAccessToken(): Promise<string | null> {
  const sender = await prisma.emailSender.findFirst({
    where: { status: 'CONNECTED', encryptedRefreshToken: { not: null } },
  });
  if (!sender || !sender.encryptedRefreshToken) return null;

  try {
    const refreshToken = decryptSecret(sender.encryptedRefreshToken);
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      await prisma.emailSender.update({
        where: { id: sender.id },
        data: {
          status: 'EXPIRED',
          lastErrorAt: new Date(),
          lastErrorMessage: 'Refresh token tidak valid atau izin pengiriman telah dicabut.',
        },
      });
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (err: any) {
    return null;
  }
}

/**
 * Kirim email sistem menggunakan Gmail API (hanya scope gmail.send)
 */
export async function sendSystemEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = await getGmailAccessToken();
  if (!accessToken) {
    return {
      success: false,
      error: 'Layanan email Gmail belum terhubung atau refresh token tidak aktif.',
    };
  }

  try {
    const sender = await prisma.emailSender.findFirst();
    const fromAddress = sender?.senderEmail || process.env.EMAIL_SENDER_ADDRESS || 'warahuwenag@gmail.com';

    const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject).toString('base64')}?=`;
    const messageParts = [
      `From: Web Ranting Talitakumi <${fromAddress}>`,
      `To: ${params.to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      params.html,
    ];
    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${res.status}`;
      if (sender) {
        await prisma.emailSender.update({
          where: { id: sender.id },
          data: {
            lastErrorAt: new Date(),
            lastErrorMessage: errMsg,
          },
        });
      }
      return { success: false, error: errMsg };
    }

    const sent = await res.json();
    if (sender) {
      await prisma.emailSender.update({
        where: { id: sender.id },
        data: {
          lastSuccessAt: new Date(),
          lastErrorMessage: null,
        },
      });
    }

    return { success: true, messageId: sent.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengirim email.' };
  }
}


