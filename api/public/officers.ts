import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
    const activePeriod = await prisma.leadershipPeriod.findFirst({
      where: { isActive: true },
      include: {
        officers: {
          where: { isVisible: true },
          include: { department: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!activePeriod) {
      return sendSuccess(res, { period: null, officers: [] });
    }

    return sendSuccess(res, {
      period: {
        id: activePeriod.id,
        name: activePeriod.name,
        startYear: activePeriod.startYear,
        endYear: activePeriod.endYear,
      },
      officers: activePeriod.officers,
    });
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat data pengurus', err.message);
  }
}

