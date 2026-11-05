import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';
import { setSecurityHeaders, getClientInfo, logSecurityEvent } from '../_lib/security';

/**
 * Endpoint Profil Akun Sendiri (/api/me/profile)
 * Fitur:
 * - Mengganti sandi tanpa perlu sandi lama
 * - Mengubah nama lengkap
 * - Khusus Super Admin: dapat mengedit email sendiri
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Autentikasi diperlukan');
  }

  const method = req.method;
  const { ip, userAgent } = getClientInfo(req);

  try {
    // 1. GET: Ambil profil akun sendiri
    if (method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return sendError(res, 404, 'Pengguna tidak ditemukan');
      }

      return sendSuccess(res, user);
    }

    // 2. PATCH: Perbarui profil dan/atau ganti sandi sendiri
    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const { name, email, password } = body;

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user) {
        return sendError(res, 404, 'Pengguna tidak ditemukan');
      }

      const updateData: Record<string, any> = {};

      // 1. Ubah Nama
      if (name && typeof name === 'string' && name.trim()) {
        updateData.name = name.trim();
      }

      // 2. Ubah Email (Khusus Super Admin)
      if (email && typeof email === 'string' && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail !== user.email) {
          if (session.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, 'Hanya Super Admin yang diizinkan untuk mengubah alamat email sendiri');
          }

          // Cek apakah email sudah dipakai pengguna lain
          const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (existing && existing.id !== user.id) {
            return sendError(res, 400, 'Alamat email ini sudah digunakan oleh akun lain');
          }

          updateData.email = normalizedEmail;
          updateData.emailNormalized = normalizedEmail;
        }
      }

      // 3. Ubah Kata Sandi (Tanpa sandi lama)
      if (password && typeof password === 'string') {
        if (password.length < 8) {
          return sendError(res, 400, 'Kata sandi baru minimal harus 8 karakter');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        updateData.passwordHash = passwordHash;
        updateData.passwordChangedAt = new Date();
      }

      if (Object.keys(updateData).length === 0) {
        return sendError(res, 400, 'Tidak ada data perubahan yang dikirimkan');
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          status: true,
          lastLoginAt: true,
          updatedAt: true,
        },
      });

      await logSecurityEvent({
        eventType: 'USER_PROFILE_UPDATED',
        severity: updateData.passwordHash ? 'WARN' : 'INFO',
        actorEmail: updated.email,
        ipAddress: ip,
        userAgent,
        details: `Pengguna memperbarui profil sendiri (${Object.keys(updateData).join(', ')})`,
      });

      return sendSuccess(res, updated, 'Profil dan kata sandi berhasil diperbarui');
    }

    return sendError(res, 405, 'Metode HTTP tidak didukung');
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memproses profil pengguna', err.message);
  }
}

