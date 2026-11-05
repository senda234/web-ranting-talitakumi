import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../../_lib/prisma';
import {
  setSecurityHeaders,
  getClientInfo,
  exchangeGoogleAuthCode,
  createDatabaseSession,
  logSecurityEvent,
} from '../../_lib/security';

/**
 * Endpoint Callback Google OAuth 2.0 / OpenID Connect
 * Menangani respon kembalian dari Google Identity Flow
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const { ip, userAgent } = getClientInfo(req);
  const host = req.headers.host || 'localhost:5173';
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;
  const url = new URL(req.url || '', baseUrl);

  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  if (error) {
    await logSecurityEvent({
      eventType: 'GOOGLE_AUTH_CANCELLED_OR_ERROR',
      severity: 'INFO',
      ipAddress: ip,
      userAgent,
      details: `Google OAuth mengembalikan error: ${error}`,
    });
    res.writeHead(302, { Location: '/admin/login?error=cancelled' });
    res.end();
    return;
  }

  if (!code) {
    res.writeHead(302, { Location: '/admin/login?error=missing_code' });
    res.end();
    return;
  }

  try {
    const googleProfile = await exchangeGoogleAuthCode(code, redirectUri);
    if (!googleProfile) {
      await logSecurityEvent({
        eventType: 'GOOGLE_AUTH_EXCHANGE_FAILED',
        severity: 'WARN',
        ipAddress: ip,
        userAgent,
        details: 'Gagal menukar authorization code dengan token Google.',
      });
      res.writeHead(302, { Location: '/admin/login?error=oauth_failed' });
      res.end();
      return;
    }

    if (!googleProfile.email_verified) {
      await logSecurityEvent({
        eventType: 'GOOGLE_AUTH_UNVERIFIED_EMAIL',
        severity: 'WARN',
        actorEmail: googleProfile.email,
        ipAddress: ip,
        userAgent,
        details: 'Email Google belum diverifikasi oleh Google.',
      });
      res.writeHead(302, { Location: '/admin/login?error=unverified_email' });
      res.end();
      return;
    }

    const normalizedEmail = googleProfile.email.toLowerCase().trim();

    // Cari pengguna di Neon PostgreSQL berdasarkan googleSub atau email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleSub: googleProfile.sub },
          { emailNormalized: normalizedEmail },
          { email: normalizedEmail },
        ],
      },
    });

    // Tolak jika email belum diundang atau tidak terdaftar
    if (!user) {
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED_UNINVITED_GOOGLE_ACCOUNT',
        severity: 'WARN',
        actorEmail: normalizedEmail,
        ipAddress: ip,
        userAgent,
        details: `Upaya login Google dari akun yang belum diundang: ${normalizedEmail}`,
      });
      res.writeHead(302, { Location: '/admin/login?error=not_invited' });
      res.end();
      return;
    }

    // Periksa status akun
    if (!user.isActive || user.status === 'DISABLED') {
      await logSecurityEvent({
        eventType: 'LOGIN_FAILED_ACCOUNT_DISABLED',
        severity: 'WARN',
        actorEmail: normalizedEmail,
        ipAddress: ip,
        userAgent,
        details: `Login Google ditolak pada akun dinonaktifkan: ${user.disabledReason || 'Tanpa keterangan'}`,
      });
      res.writeHead(302, { Location: '/admin/login?error=disabled' });
      res.end();
      return;
    }

    if (user.status === 'LOCKED' || user.status === 'DELETED') {
      res.writeHead(302, { Location: '/admin/login?error=locked' });
      res.end();
      return;
    }

    // Tautkan identitas Google dan aktifkan akun pada login pertama kali
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleSub: googleProfile.sub,
        googleEmail: googleProfile.email,
        googleLinkedAt: user.googleLinkedAt || new Date(),
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
        emailNormalized: normalizedEmail,
        authProvider: 'GOOGLE',
        status: 'ACTIVE',
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    // Buat sesi database
    await createDatabaseSession(user.id, req, res);

    await logSecurityEvent({
      eventType: 'LOGIN_SUCCESS_GOOGLE',
      severity: 'INFO',
      actorEmail: normalizedEmail,
      ipAddress: ip,
      userAgent,
      details: `Login Google berhasil untuk ${user.name} (${user.role})`,
    });

    res.writeHead(302, { Location: '/admin' });
    res.end();
  } catch (err: any) {
    res.writeHead(302, { Location: `/admin/login?error=server_error&msg=${encodeURIComponent(err.message || '')}` });
    res.end();
  }
}

