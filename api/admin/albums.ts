import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Endpoint Pengelolaan Galeri & Album di Neon PostgreSQL
 * Mendukung pembacaan, pembuatan, pengeditan nama & info album, serta perubahan status publikasi.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  const method = req.method;

  try {
    // 1. GET: Ambil daftar seluruh album
    if (method === 'GET') {
      const albums = await prisma.album.findMany({
        where: { deletedAt: null },
        include: {
          department: true,
          _count: { select: { albumMedia: true } },
        },
        orderBy: { sortOrder: 'asc' },
      });
      return sendSuccess(res, albums);
    }

    // 2. POST: Buat album baru
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const { title, slug, description, category, departmentId, coverUrl } = body;

      if (!title) {
        return sendError(res, 400, 'Nama album wajib diisi');
      }

      const generatedSlug = (slug || title)
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');

      const count = await prisma.album.count();

      const created = await prisma.album.create({
        data: {
          title: title.trim(),
          slug: generatedSlug,
          description: description?.trim() || null,
          category: category === 'KEGIATAN_KHUSUS' ? 'KEGIATAN_KHUSUS' : 'BIDANG',
          departmentId: departmentId || null,
          coverUrl: coverUrl || null,
          sortOrder: count + 1,
          status: 'DRAFT',
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE_ALBUM',
          entityType: 'Album',
          entityId: created.id,
          summary: `Membuat album baru: ${created.title}`,
        },
      });

      return sendSuccess(res, created, 'Album baru berhasil dibuat di database Neon');
    }

    // 3. PATCH: Ubah nama album, deskripsi, kategori, atau status publikasi
    if (method === 'PATCH') {
      const body = await parseJsonBody(req);
      const { id, title, slug, description, category, status, coverUrl } = body;

      if (!id && !slug) {
        return sendError(res, 400, 'ID atau slug album wajib disertakan');
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let album = null;
      if (id && isUuid.test(id)) {
        album = await prisma.album.findUnique({ where: { id } });
      }
      if (!album && slug) {
        album = await prisma.album.findUnique({ where: { slug } });
      }
      if (!album && title) {
        album = await prisma.album.findFirst({ where: { title: title.trim() } });
      }

      if (!album) {
        return sendError(res, 404, 'Album tidak ditemukan');
      }

      const updated = await prisma.album.update({
        where: { id: album.id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(category !== undefined && {
            category: category === 'KEGIATAN_KHUSUS' ? 'KEGIATAN_KHUSUS' : 'BIDANG',
          }),
          ...(status !== undefined && { status }),
          ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
          ...(status === 'PUBLISHED' && !album.publishedAt && { publishedAt: new Date() }),
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: 'UPDATE_ALBUM',
          entityType: 'Album',
          entityId: album.id,
          summary: `Memperbarui info/nama album: ${updated.title}`,
        },
      });

      return sendSuccess(res, updated, 'Album berhasil diperbarui di database Neon');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Operasi album gagal', err.message);
  }
}

