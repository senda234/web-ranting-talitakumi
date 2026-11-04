import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Endpoint Pengelolaan Pengurus di Neon PostgreSQL
 * Memperbarui data pengurus dan URL/path foto hasil upload Cloudinary.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  const method = req.method;

  try {
    if (method === 'GET') {
      const officers = await prisma.officer.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { department: true },
      });
      return sendSuccess(res, officers);
    }

    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const { id, name, title, photoUrl, instagram, isVisible, departmentId } = body;

      if (!id) {
        return sendError(res, 400, 'ID pengurus wajib disertakan');
      }

      const updated = await prisma.officer.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(title !== undefined && { title: title.trim() }),
          ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
          ...(instagram !== undefined && { instagram: instagram?.trim() || null }),
          ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
          ...(departmentId !== undefined && { departmentId: departmentId || null }),
        },
      });

      // Catat log aktivitas
      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: 'UPDATE_OFFICER',
          entityType: 'Officer',
          entityId: id,
          summary: `Memperbarui data pengurus: ${updated.name} (${updated.title})`,
        },
      });

      return sendSuccess(res, updated, 'Data pengurus berhasil diperbarui');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Operasi pengurus gagal', err.message);
  }
}

