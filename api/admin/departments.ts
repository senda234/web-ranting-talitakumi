import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  const method = req.method;

  try {
    if (method === 'GET') {
      const departments = await prisma.department.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { programs: true, officers: true },
          },
        },
      });
      return sendSuccess(res, departments);
    }

    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { romanNumber, name, shortName, description, imageUrl, sortOrder, isVisible } = body;

      if (!romanNumber || !name) {
        return sendError(res, 400, 'Nomor romawi dan nama bidang wajib diisi');
      }

      const created = await prisma.department.create({
        data: {
          romanNumber: romanNumber.trim().toUpperCase(),
          name: name.trim(),
          shortName: shortName?.trim() || romanNumber.trim(),
          description: description?.trim() || '',
          imageUrl: imageUrl?.trim() || null,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
          isVisible: isVisible !== undefined ? Boolean(isVisible) : true,
        },
      });

      return sendSuccess(res, created, 'Bidang berhasil ditambahkan');
    }

    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const { id, romanNumber, name, shortName, description, imageUrl, sortOrder, isVisible } = body;

      if (!id && !romanNumber && !name) {
        return sendError(res, 400, 'ID, nomor romawi, atau nama bidang wajib disertakan');
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let existingDept = null;

      if (id && isUuid.test(id)) {
        existingDept = await prisma.department.findUnique({ where: { id } });
      }
      if (!existingDept && romanNumber) {
        existingDept = await prisma.department.findFirst({
          where: { romanNumber: romanNumber.trim().toUpperCase() },
        });
      }
      if (!existingDept && name) {
        existingDept = await prisma.department.findFirst({
          where: { name: name.trim() },
        });
      }

      if (!existingDept) {
        return sendError(res, 404, 'Data bidang tidak ditemukan di database Neon');
      }

      const updated = await prisma.department.update({
        where: { id: existingDept.id },
        data: {
          ...(romanNumber && { romanNumber: romanNumber.trim().toUpperCase() }),
          ...(name && { name: name.trim() }),
          ...(shortName !== undefined && { shortName: shortName.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
          ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
          ...(isVisible !== undefined && { isVisible: Boolean(isVisible) }),
        },
      });

      return sendSuccess(res, updated, 'Bidang berhasil diperbarui');
    }

    return sendError(res, 405, 'Metode HTTP tidak didukung');
  } catch (err: any) {
    return sendError(res, 500, 'Terjadi kesalahan sistem saat mengelola bidang', err.message);
  }
}

