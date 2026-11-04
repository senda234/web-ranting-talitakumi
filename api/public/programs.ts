import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
    const departments = await prisma.department.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        programs: {
          where: { isVisible: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            activities: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    return sendSuccess(res, departments);
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat data program', err.message);
  }
}

