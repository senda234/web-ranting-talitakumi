import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../../_lib/prisma';
import { getSession } from '../../_lib/auth';
import { sendSuccess, sendError } from '../../_lib/response';
import { setSecurityHeaders } from '../../_lib/security';

/**
 * Endpoint Statistik & Metrik Keamanan (Super Admin Only - §28.2)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  const session = getSession(req);
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
    return sendError(res, 403, 'Akses ditolak: Hanya Super Admin dan Admin yang berwenang melihat dasbor keamanan');
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      activeUsersCount,
      pendingUsersCount,
      disabledUsersCount,
      activeSessionsCount,
      failedLogins24h,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE', isActive: true } }),
      prisma.user.count({ where: { status: 'PENDING_ACTIVATION' } }),
      prisma.user.count({ where: { status: 'DISABLED' } }),
      prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      prisma.securityEvent.count({
        where: {
          eventType: { startsWith: 'LOGIN_FAILED' },
          createdAt: { gte: oneDayAgo },
        },
      }),
      prisma.securityEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return sendSuccess(res, {
      metrics: {
        activeUsersCount,
        pendingUsersCount,
        disabledUsersCount,
        activeSessionsCount,
        failedLogins24h,
        lastSecurityCheckAt: new Date().toISOString(),
      },
      recentEvents,
    });
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat statistik keamanan', err.message);
  }
}

