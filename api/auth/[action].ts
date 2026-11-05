import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import prisma from '../_lib/prisma';
import { parseJsonBody } from '../_lib/body';
import { setSessionCookie, clearSessionCookie, getSession } from '../_lib/auth';
import {
  setSecurityHeaders,
  checkRateLimit,
  getClientInfo,
  hashToken,
  hashPassword,
  createDatabaseSession,
  revokeSession,
  revokeAllUserSessions,
  logSecurityEvent,
  verifyGoogleToken,
  exchangeGoogleAuthCode,
  sendSystemEmail,
} from '../_lib/security';
import { templateAccountActivated } from '../_lib/email-templates';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Endpoint Autentikasi Terpadu Berbasis Keamanan & Sesi Database:
 * Menangani login, logout, me, aktivasi akun baru, dan reset password.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const action = url.pathname.split('/').filter(Boolean).pop();
  const { ip, userAgent } = getClientInfo(req);

  // GOOGLE CONFIG (Ambil info konfigurasi Client ID untuk frontend)
  if (action === 'google-config') {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    return sendSuccess(res, {
      clientId,
      isConfigured: !!clientId,
    });
  }

  // GOOGLE CALLBACK (Redirect dari Google OAuth 2.0 Flow)
  if (action === 'google-callback' || action === 'callback' || url.pathname.includes('/callback')) {
    const error = url.searchParams.get('error');
    const code = url.searchParams.get('code');
    const redirectUri = `${url.origin}/api/auth/callback/google`;

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
        res.writeHead(302, { Location: '/admin/login?error=oauth_failed' });
        res.end();
        return;
      }

      if (!googleProfile.email_verified) {
        res.writeHead(302, { Location: '/admin/login?error=unverified_email' });
        res.end();
        return;
      }

      const normalizedEmail = googleProfile.email.toLowerCase().trim();
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleSub: googleProfile.sub },
            { emailNormalized: normalizedEmail },
            { email: normalizedEmail },
          ],
        },
      });

      if (!user) {
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED_UNINVITED_GOOGLE_ACCOUNT',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: `Upaya login Google dari akun yang belum didaftarkan: ${normalizedEmail}`,
        });
        res.writeHead(302, { Location: '/admin/login?error=not_invited' });
        res.end();
        return;
      }

      if (!user.isActive || user.status === 'DISABLED') {
        res.writeHead(302, { Location: '/admin/login?error=disabled' });
        res.end();
        return;
      }

      if (user.status === 'LOCKED' || user.status === 'DELETED') {
        res.writeHead(302, { Location: '/admin/login?error=locked' });
        res.end();
        return;
      }

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
      return;
    } catch {
      res.writeHead(302, { Location: '/admin/login?error=server_error' });
      res.end();
      return;
    }
  }

  // GOOGLE LOGIN (Verifikasi identitas akun Google dari browser)
  if (action === 'google-login') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { credential, code, redirectUri } = await parseJsonBody(req);

      if (!credential && !code) {
        return sendError(res, 400, 'Kredensial atau kode autentikasi Google wajib disertakan');
      }

      let profile: { sub: string; email: string; email_verified: boolean; name?: string } | null = null;

      if (credential) {
        profile = await verifyGoogleToken(credential);
      } else if (code) {
        const redirect = redirectUri || `${url.origin}/api/auth/callback/google`;
        profile = await exchangeGoogleAuthCode(code, redirect);
      }

      if (!profile) {
        return sendError(res, 401, 'Kredensial Google tidak valid atau telah kedaluwarsa.');
      }

      if (!profile.email_verified) {
        return sendError(res, 403, 'Email Google Anda belum terverifikasi oleh Google.');
      }

      const normalizedEmail = profile.email.toLowerCase().trim();

      // Cari pengguna di Neon PostgreSQL
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleSub: profile.sub },
            { emailNormalized: normalizedEmail },
            { email: normalizedEmail },
          ],
        },
      });

      // Tolak jika belum diundang
      if (!user) {
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED_UNINVITED_GOOGLE_ACCOUNT',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: `Upaya login Google dari email yang belum diundang: ${normalizedEmail}`,
        });
        return sendError(res, 403, 'Email Google ini belum memiliki akses admin. Akses hanya tersedia untuk email yang telah diundang oleh Super Admin.');
      }

      // Periksa status akun
      if (!user.isActive || user.status === 'DISABLED') {
        return sendError(res, 403, 'Akun tidak aktif. Hubungi Super Admin.');
      }

      if (user.status === 'LOCKED') {
        return sendError(res, 403, 'Akun dikunci karena alasan keamanan. Hubungi Super Admin.');
      }

      if (user.status === 'DELETED') {
        return sendError(res, 403, 'Akun telah dihapus.');
      }

      // Tautkan Google Sub dan perbarui profil jika pertama kali
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleSub: profile.sub,
          googleEmail: profile.email,
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
      const { session } = await createDatabaseSession(updatedUser.id, req, res);

      await logSecurityEvent({
        eventType: 'LOGIN_SUCCESS_GOOGLE',
        severity: 'INFO',
        actorEmail: normalizedEmail,
        ipAddress: ip,
        userAgent,
        details: `Login Google berhasil untuk ${updatedUser.name} (${updatedUser.role})`,
      });

      return sendSuccess(
        res,
        {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            permissions: (updatedUser as any).permissions || [],
          },
        },
        'Login Google berhasil'
      );
    } catch (err: any) {
      return sendError(res, 500, 'Login belum dapat diproses. Silakan coba kembali.', err.message);
    }
  }

  // VERIFIKASI TOKEN UNDANGAN (GET)
  if (action === 'verify-invitation') {
    if (req.method !== 'GET') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    const token = url.searchParams.get('token');
    if (!token) {
      return sendError(res, 400, 'Token undangan wajib disertakan');
    }

    const tokenHash = hashToken(token);
    const invitation = await prisma.adminInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.isUsed || invitation.expiresAt <= new Date()) {
      return sendError(res, 400, 'Undangan sudah kedaluwarsa atau telah digunakan. Minta Super Admin mengirim ulang.');
    }

    return sendSuccess(res, {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  }

  // GOOGLE ACTIVATE (Aktivasi undangan melalui penautan akun Google)
  if (action === 'google-activate') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { token, credential, code, redirectUri } = await parseJsonBody(req);

      if (!token) {
        return sendError(res, 400, 'Token undangan wajib disertakan');
      }

      const tokenHash = hashToken(token);
      const invitation = await prisma.adminInvitation.findUnique({
        where: { tokenHash },
      });

      if (!invitation || invitation.isUsed || invitation.expiresAt <= new Date()) {
        return sendError(res, 400, 'Undangan sudah kedaluwarsa. Minta Super Admin mengirim ulang.');
      }

      let profile: { sub: string; email: string; email_verified: boolean; name?: string } | null = null;
      if (credential) {
        profile = await verifyGoogleToken(credential);
      } else if (code) {
        const redirect = redirectUri || `${url.origin}/api/auth/callback/google`;
        profile = await exchangeGoogleAuthCode(code, redirect);
      }

      if (!profile) {
        return sendError(res, 401, 'Kredensial akun Google tidak valid.');
      }

      const googleEmailNormalized = profile.email.toLowerCase().trim();
      const inviteEmailNormalized = invitation.email.toLowerCase().trim();

      // Pastikan email Google sama dengan email undangan (§8 item 9)
      if (googleEmailNormalized !== inviteEmailNormalized) {
        return sendError(res, 400, `Gunakan akun Google yang sama dengan email undangan (${invitation.email}). Anda masuk sebagai ${profile.email}.`);
      }

      // Aktifkan akun pengguna dan tandai undangan terpakai
      const updatedUser = await prisma.$transaction(async (tx) => {
        await tx.adminInvitation.update({
          where: { id: invitation.id },
          data: { isUsed: true, usedAt: new Date() },
        });

        return await tx.user.update({
          where: { email: invitation.email },
          data: {
            authProvider: 'GOOGLE',
            googleSub: profile.sub,
            googleEmail: profile.email,
            googleLinkedAt: new Date(),
            emailVerifiedAt: new Date(),
            emailNormalized: googleEmailNormalized,
            status: 'ACTIVE',
            isActive: true,
            lastLoginAt: new Date(),
          },
        });
      });

      // Kirim email notifikasi aktivasi berhasil jika sender terhubung
      sendSystemEmail({
        to: updatedUser.email,
        ...templateAccountActivated({ name: updatedUser.name }),
      }).catch(() => {});

      // Buat sesi database
      await createDatabaseSession(updatedUser.id, req, res);

      await logSecurityEvent({
        eventType: 'ACCOUNT_ACTIVATED_GOOGLE',
        severity: 'INFO',
        actorEmail: updatedUser.email,
        ipAddress: ip,
        userAgent,
        details: `Akun Google berhasil ditautkan dan diaktifkan untuk peran ${updatedUser.role}`,
      });

      return sendSuccess(
        res,
        {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            permissions: (updatedUser as any).permissions || [],
          },
        },
        'Akun Google Anda berhasil dihubungkan dan diaktifkan. Selamat datang di Portal Pengurus!'
      );
    } catch (err: any) {
      return sendError(res, 500, 'Gagal mengaktifkan akun Google', err.message);
    }
  }

  // 1. LOGIN (Fallback Kata Sandi / Mode Pemulihan Darurat)
  if (action === 'login' || action === 'sign-in') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { email, password } = await parseJsonBody(req);
      const normalizedEmail = (email || '').trim().toLowerCase();

      if (!normalizedEmail || !password) {
        return sendError(res, 400, 'Email dan kata sandi wajib diisi');
      }

      // Rate limit: 5 percobaan per 15 menit per IP + email (§17.2)
      const rateLimitKey = `login:${ip}:${hashToken(normalizedEmail).substring(0, 12)}`;
      const rateCheck = await checkRateLimit(rateLimitKey, 5, 15 * 60);
      if (!rateCheck.allowed) {
        await logSecurityEvent({
          eventType: 'LOGIN_RATE_LIMIT_EXCEEDED',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: `Rate limit terlampaui. Tunggu ${rateCheck.retryAfterSeconds} detik.`,
        });
        res.setHeader('Retry-After', rateCheck.retryAfterSeconds.toString());
        return sendError(
          res,
          429,
          `Terlalu banyak percobaan login. Silakan tunggu ${rateCheck.retryAfterSeconds} detik.`
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Pesan umum sesuai §14.3 untuk mencegah enumerasi akun
      if (!user) {
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED_UNKNOWN_EMAIL',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: 'Upaya login dengan email yang tidak terdaftar.',
        });
        return sendError(res, 401, 'Email atau kata sandi tidak sesuai.');
      }

      if (!user.isActive || user.status === 'DISABLED') {
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED_ACCOUNT_DISABLED',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: `Upaya login pada akun dinonaktifkan: ${user.disabledReason || 'Tanpa keterangan'}`,
        });
        return sendError(
          res,
          403,
          'Akses akun ini telah dinonaktifkan. Hubungi Super Admin jika Anda memerlukan bantuan.'
        );
      }

      if (user.status === 'PENDING_ACTIVATION') {
        return sendError(
          res,
          403,
          'Akun Anda belum diaktifkan. Silakan periksa tautan aktivasi yang diberikan oleh Super Admin.'
        );
      }

      if (!user.passwordHash) {
        return sendError(
          res,
          400,
          'Akun ini dikonfigurasi melalui Google Sign-In. Silakan gunakan tombol Masuk dengan Google.'
        );
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        await logSecurityEvent({
          eventType: 'LOGIN_FAILED_BAD_PASSWORD',
          severity: 'WARN',
          actorEmail: normalizedEmail,
          ipAddress: ip,
          userAgent,
          details: 'Kata sandi tidak sesuai.',
        });
        return sendError(res, 401, 'Email atau kata sandi tidak sesuai.');
      }

      // Buat sesi berbasis database (§15)
      const { session } = await createDatabaseSession(user.id, req, res);

      // Perbarui waktu login terakhir
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await logSecurityEvent({
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        actorEmail: normalizedEmail,
        ipAddress: ip,
        userAgent,
        details: `Login berhasil sebagai ${user.role} (Session ID: ${session.id})`,
      });

      return sendSuccess(
        res,
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            permissions: (user as any).permissions || [],
          },
        },
        'Login berhasil'
      );
    } catch (err: any) {
      return sendError(res, 500, 'Terjadi kesalahan sistem saat autentikasi', err.message);
    }
  }

  // 2. LOGOUT
  if (action === 'logout') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const session = await getSession(req);
      if (session) {
        await revokeAllUserSessions(session.userId);
      }
      clearSessionCookie(res);
      return sendSuccess(res, null, 'Logout berhasil');
    } catch (err: any) {
      clearSessionCookie(res);
      return sendSuccess(res, null, 'Logout berhasil');
    }
  }

  // 3. ME (SESSION VERIFICATION)
  if (action === 'me') {
    if (req.method !== 'GET') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    const session = await getSession(req);
    if (!session) {
      return sendError(res, 401, 'Sesi tidak valid atau telah berakhir');
    }

    const rawUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!rawUser || rawUser.status === 'DISABLED') {
      return sendError(res, 401, 'Akun tidak aktif');
    }

    const userData = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      status: rawUser.status,
      permissions: (rawUser as any).permissions || [],
      lastLoginAt: rawUser.lastLoginAt,
    };

    return sendSuccess(res, { user: userData });
  }

  // 4. AKTIVASI AKUN BARU (§11 & §12)
  if (action === 'activate') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { token, password, confirmPassword } = await parseJsonBody(req);

      if (!token || !password) {
        return sendError(res, 400, 'Token aktivasi dan kata sandi wajib diisi');
      }

      if (password.length < 8) {
        return sendError(
          res,
          400,
          'Kata sandi harus minimal 8 karakter.'
        );
      }

      if (password !== confirmPassword) {
        return sendError(res, 400, 'Konfirmasi kata sandi tidak cocok.');
      }

      // Rate limit aktivasi: 10 percobaan per 15 menit (§17.2)
      const rateKey = `activate:${ip}`;
      const rateCheck = await checkRateLimit(rateKey, 10, 15 * 60);
      if (!rateCheck.allowed) {
        return sendError(res, 429, 'Terlalu banyak percobaan aktivasi. Coba lagi beberapa saat.');
      }

      const tokenHash = hashToken(token);
      const invitation = await prisma.adminInvitation.findUnique({
        where: { tokenHash },
      });

      if (!invitation || invitation.isUsed || invitation.expiresAt <= new Date()) {
        return sendError(
          res,
          400,
          'Tautan aktivasi tidak valid, telah digunakan, atau sudah kedaluwarsa (maks. 24 jam).'
        );
      }

      const hashedPassword = await hashPassword(password);

      // Jalankan transaksi aktivasi akun (§29.4)
      const updatedUser = await prisma.$transaction(async (tx) => {
        // Tandai undangan selesai dipakai
        await tx.adminInvitation.update({
          where: { id: invitation.id },
          data: { isUsed: true, usedAt: new Date() },
        });

        // Aktifkan akun pengguna
        return await tx.user.update({
          where: { email: invitation.email },
          data: {
            passwordHash: hashedPassword,
            status: 'ACTIVE',
            isActive: true,
            emailVerifiedAt: new Date(),
            passwordChangedAt: new Date(),
          },
        });
      });

      // Buat sesi database pertama
      await createDatabaseSession(updatedUser.id, req, res);

      await logSecurityEvent({
        eventType: 'ACCOUNT_ACTIVATED',
        severity: 'INFO',
        actorEmail: updatedUser.email,
        ipAddress: ip,
        userAgent,
        details: `Akun berhasil diaktifkan dengan role ${updatedUser.role}`,
      });

      return sendSuccess(
        res,
        {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
          },
        },
        'Akun berhasil diaktifkan. Selamat datang di portal pengurus.'
      );
    } catch (err: any) {
      return sendError(res, 500, 'Gagal memproses aktivasi akun', err.message);
    }
  }

  // 5. RESET PASSWORD (§13)
  if (action === 'reset-password') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { token, password, confirmPassword } = await parseJsonBody(req);

      if (!token || !password) {
        return sendError(res, 400, 'Token reset dan kata sandi baru wajib disertakan');
      }

      if (password.length < 12) {
        return sendError(res, 400, 'Kata sandi baru minimal 12 karakter.');
      }

      if (password !== confirmPassword) {
        return sendError(res, 400, 'Konfirmasi kata sandi tidak cocok.');
      }

      const tokenHash = hashToken(token);
      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt <= new Date()) {
        return sendError(res, 400, 'Token reset tidak valid atau sudah kedaluwarsa.');
      }

      const hashedPassword = await hashPassword(password);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { isUsed: true, usedAt: new Date() },
        });

        await tx.user.update({
          where: { id: resetRecord.userId },
          data: {
            passwordHash: hashedPassword,
            passwordChangedAt: new Date(),
          },
        });
      });

      // Cabut seluruh sesi lama (§13.2 & §15.5)
      await revokeAllUserSessions(resetRecord.userId);

      await logSecurityEvent({
        eventType: 'PASSWORD_RESET_COMPLETED',
        severity: 'INFO',
        actorEmail: resetRecord.user.email,
        ipAddress: ip,
        userAgent,
        details: 'Kata sandi berhasil direset dan seluruh sesi lama telah dicabut.',
      });

      return sendSuccess(res, null, 'Kata sandi berhasil diperbarui. Silakan login kembali.');
    } catch (err: any) {
      return sendError(res, 500, 'Gagal memproses reset kata sandi', err.message);
    }
  }

  return sendError(res, 404, 'Endpoint auth tidak ditemukan');
}
