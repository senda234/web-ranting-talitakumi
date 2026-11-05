import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import prisma from './_lib/prisma';
import { getSession } from './_lib/auth';
import { parseJsonBody } from './_lib/body';
import { sendSuccess, sendError } from './_lib/response';
import { setSecurityHeaders, getClientInfo, logSecurityEvent, revokeSession } from './_lib/security';

/**
 * Endpoint Terpadu Pengguna Sendiri (/api/me/profile & /api/me/sessions)
 * Menggabungkan pengelolaan profil dan sesi perangkat ke dalam satu serverless function
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const session = await getSession(req);
  if (!session) {
    return sendError(res, 401, 'Autentikasi diperlukan');
  }

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const queryResource = url.searchParams.get('resource');
  const pathResource = url.pathname.split('/').filter(Boolean).pop();
  const resource =
    queryResource && queryResource !== 'me' && queryResource !== '[resource]'
      ? queryResource
      : pathResource && pathResource !== 'me' && pathResource !== '[resource]'
      ? pathResource
      : queryResource;
  const method = req.method;
  const { ip, userAgent } = getClientInfo(req);

  try {
    // ----------------------------------------------------
    // 1. RESOURCE: PROFILE (/api/me/profile)
    // ----------------------------------------------------
    if (resource === 'profile') {
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

        // Ubah Nama
        if (name && typeof name === 'string' && name.trim()) {
          updateData.name = name.trim();
        }

        // Ubah Email (Khusus Super Admin)
        if (email && typeof email === 'string' && email.trim()) {
          const normalizedEmail = email.trim().toLowerCase();

          if (normalizedEmail !== user.email) {
            if (session.role !== 'SUPER_ADMIN') {
              return sendError(res, 403, 'Hanya Super Admin yang diizinkan untuk mengubah alamat email sendiri');
            }

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

        // Ubah Kata Sandi (Tanpa sandi lama)
        if (password && typeof password === 'string') {
          if (password.length < 8) {
            return sendError(res, 400, 'Kata sandi baru minimal harus 8 karakter');
          }

          const passwordHash = await bcrypt.hash(password, 10);
          updateData.passwordHash = passwordHash;
          updateData.passwordChangedAt = new Date();
        }

        const updatedUser = await prisma.user.update({
          where: { id: session.userId },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            status: true,
          },
        });

        await logSecurityEvent({
          eventType: 'USER_PROFILE_UPDATED',
          severity: 'INFO',
          actorEmail: user.email,
          ipAddress: ip,
          userAgent,
          details: `Profil diperbarui oleh pengguna sendiri: ${Object.keys(updateData).join(', ')}`,
        });

        return sendSuccess(res, updatedUser, 'Profil berhasil diperbarui');
      }

      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    // ----------------------------------------------------
    // 2. RESOURCE: SESSIONS (/api/me/sessions)
    // ----------------------------------------------------
    if (resource === 'sessions') {
      if (method === 'GET') {
        const activeSessions = await prisma.session.findMany({
          where: {
            userId: session.userId,
            expiresAt: { gt: new Date() },
          },
          orderBy: { lastActiveAt: 'desc' },
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            lastActiveAt: true,
            createdAt: true,
          },
        });

        return sendSuccess(res, activeSessions);
      }

      if (method === 'DELETE') {
        const targetSessionId = url.searchParams.get('sessionId');
        const revokeOthers = url.searchParams.get('revokeOthers') === 'true';

        if (revokeOthers) {
          await prisma.session.deleteMany({
            where: {
              userId: session.userId,
              ...(targetSessionId && { id: { not: targetSessionId } }),
            },
          });
          return sendSuccess(res, null, 'Seluruh sesi lain berhasil dicabut');
        }

        if (targetSessionId) {
          const sessionRecord = await prisma.session.findUnique({
            where: { id: targetSessionId },
          });

          if (!sessionRecord || sessionRecord.userId !== session.userId) {
            return sendError(res, 403, 'Anda tidak berwenang mencabut sesi perangkat ini');
          }

          await revokeSession(targetSessionId);
          return sendSuccess(res, null, 'Sesi berhasil dicabut');
        }

        return sendError(res, 400, 'Parameter sessionId atau revokeOthers wajib disertakan');
      }

      return sendError(res, 405, 'Metode tidak diizinkan');
    }

    return sendError(res, 404, 'Resource tidak ditemukan');
  } catch (err: any) {
    return sendError(res, 500, 'Terjadi kesalahan sistem', err.message);
  }
}

