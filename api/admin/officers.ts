import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma.js';
import { getSession } from '../_lib/auth.js';
import { parseJsonBody } from '../_lib/body.js';
import { sendSuccess, sendError } from '../_lib/response.js';

/**
 * Endpoint Pengelolaan Pengurus di Neon PostgreSQL
 * Memperbarui data pengurus dan URL/path foto hasil upload Cloudinary.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const session = await getSession(req);
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
      const { id, positionKey, name, title, photoUrl, instagram, isVisible, departmentId } = body;

      if (!id && !positionKey && !name) {
        return sendError(res, 400, 'ID atau positionKey pengurus wajib disertakan');
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let existingOfficer = null;

      if (id && isUuid.test(id)) {
        existingOfficer = await prisma.officer.findUnique({ where: { id } });
      }
      if (!existingOfficer && positionKey) {
        existingOfficer = await prisma.officer.findFirst({ where: { positionKey } });
      }
      if (!existingOfficer && name) {
        existingOfficer = await prisma.officer.findFirst({ where: { name: name.trim() } });
      }

      if (!existingOfficer) {
        return sendError(res, 404, 'Data pengurus tidak ditemukan di database Neon');
      }

      const updated = await prisma.officer.update({
        where: { id: existingOfficer.id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(title !== undefined && { title: title.trim() }),
          ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
          ...(instagram !== undefined && { instagram: instagram?.trim() || null }),
          ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
          ...(departmentId !== undefined && { departmentId: departmentId || null }),
        },
      });

      // Catat log aktivitas jika user session ada
      try {
        await prisma.activityLog.create({
          data: {
            userId: session.userId,
            action: 'UPDATE_OFFICER',
            entityType: 'Officer',
            entityId: existingOfficer.id,
            summary: `Memperbarui data pengurus: ${updated.name} (${updated.title})`,
          },
        });
      } catch {
        // Non-blocking log
      }

      return sendSuccess(res, updated, 'Data pengurus berhasil diperbarui');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Operasi pengurus gagal', err.message);
  }
}

