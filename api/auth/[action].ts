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
  sendSystemEmail,
} from '../_lib/security';
import { templateAccountActivated } from '../_lib/email-templates';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Endpoint Autentikasi Terpadu Berbasis Keamanan & Sesi Database:
 * Menangani login, logout, me, verifikasi undangan, aktivasi akun baru, dan reset password.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const queryAction = url.searchParams.get('action');
  const pathAction = url.pathname.split('/').filter(Boolean).pop();
  const action =
    queryAction && queryAction !== '[action]'
      ? queryAction
      : pathAction && pathAction !== '[action]'
      ? pathAction
      : queryAction;
  const { ip, userAgent } = getClientInfo(req);

  // 1. VERIFIKASI TOKEN UNDANGAN (GET)
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

  // 2. LOGIN (Email & Kata Sandi)
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

      // Rate limit: 5 percobaan per 15 menit per IP + email
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

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { emailNormalized: normalizedEmail },
          ],
        },
      });

      // Pesan umum untuk mencegah enumerasi akun
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
          'Kata sandi akun belum disetel. Silakan gunakan tautan aktivasi akun.'
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

      // Buat sesi berbasis database
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

  // 3. LOGOUT
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

  // 4. ME (SESSION VERIFICATION)
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

  // 5. AKTIVASI AKUN BARU
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

      // Rate limit aktivasi: 10 percobaan per 15 menit
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

      // Jalankan transaksi aktivasi akun
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

  // 6. RESET PASSWORD
  if (action === 'reset-password') {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    try {
      const { token, password, confirmPassword } = await parseJsonBody(req);

      if (!token || !password) {
        return sendError(res, 400, 'Token reset dan kata sandi baru wajib disertakan');
      }

      if (password.length < 8) {
        return sendError(res, 400, 'Kata sandi baru minimal 8 karakter.');
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

      // Cabut seluruh sesi lama
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
