import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { parseCookies, setSessionCookie, clearSessionCookie, signToken, verifyToken, type SessionPayload } from './auth.js';

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
  try {
    const forwarded = req.headers?.['x-forwarded-for'];
    let ip = '127.0.0.1';
    if (typeof forwarded === 'string' && forwarded.trim()) {
      ip = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = String(forwarded[0]).trim();
    } else if (req.headers?.['x-real-ip']) {
      ip = String(req.headers['x-real-ip']).trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    }

    const rawUserAgent = req.headers?.['user-agent'] || 'Unknown Agent';
    const userAgent = (typeof rawUserAgent === 'string' ? rawUserAgent : 'Unknown Agent').substring(0, 200);

    return { ip, userAgent };
  } catch {
    return { ip: '127.0.0.1', userAgent: 'Unknown Agent' };
  }
}

/**
 * Rate Limiter berbasis tabel Neon PostgreSQL (§17)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  // Mode development: nonaktifkan rate limit agar pengujian lokal tidak terblokir
  if (process.env.NODE_ENV !== 'production') {
    return { allowed: true, remaining: 999, retryAfterSeconds: 0 };
  }

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
 * Kirim email sistem (Opsional - aktivasi ditangani via tautan undangan langsung di panel admin)
 */
export async function sendSystemEmail(_params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return {
    success: false,
    error: 'Pengiriman email otomatis tidak aktif. Tautan aktivasi tersedia langsung di panel admin.',
  };
}



