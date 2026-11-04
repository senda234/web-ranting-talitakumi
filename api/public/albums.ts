import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
    const albums = await prisma.album.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        department: true,
        _count: {
          select: { albumMedia: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return sendSuccess(res, albums);
  } catch (err: any) {
    return sendError(res, 500, 'Gagal memuat galeri', err.message);
  }
}

