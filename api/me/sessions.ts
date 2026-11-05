import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { sendSuccess, sendError } from '../_lib/response';
import { setSecurityHeaders, revokeSession } from '../_lib/security';

/**
 * Endpoint Pengelolaan Sesi Pengguna Aktif (§28.3 & §30)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Autentikasi diperlukan');
  }

  const method = req.method;

  try {
    // 1. GET: Ambil daftar sesi aktif milik pengguna ini
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

    // 2. DELETE: Cabut sesi tertentu atau cabut seluruh sesi lain
    if (method === 'DELETE') {
      const urlParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
      const targetSessionId = urlParams.get('sessionId');
      const revokeOthers = urlParams.get('revokeOthers') === 'true';

      if (revokeOthers) {
        // Cabut seluruh sesi kecuali sesi saat ini (jika ada id)
        await prisma.session.deleteMany({
          where: {
            userId: session.userId,
            ...(targetSessionId && { id: { not: targetSessionId } }),
          },
        });
        return sendSuccess(res, null, 'Seluruh sesi lain berhasil dicabut');
      }

      if (targetSessionId) {
        // Hanya izinkan mencabut sesi milik diri sendiri (object-level authorization - §16.3)
        const sessionRecord = await prisma.session.findUnique({
          where: { id: targetSessionId },
        });

        if (!sessionRecord || sessionRecord.userId !== session.userId) {
          return sendError(res, 403, 'Akses ditolak: Anda tidak berhak mencabut sesi ini');
        }

        await revokeSession(targetSessionId);
        return sendSuccess(res, null, 'Sesi berhasil dicabut');
      }

      return sendError(res, 400, 'Parameter sessionId atau revokeOthers diperlukan');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memproses sesi', err.message);
  }
}

