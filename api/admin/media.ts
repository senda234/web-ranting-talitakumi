import type { IncomingMessage, ServerResponse } from 'http';
import prisma from '../_lib/prisma';
import { getSession } from '../_lib/auth';
import { parseJsonBody } from '../_lib/body';
import { sendSuccess, sendError } from '../_lib/response';

/**
 * Endpoint Pengelolaan Media Assets di Neon PostgreSQL
 * File fisik/gambar tersimpan di Cloudinary CDN, sedangkan seluruh metadata,
 * path (secure_url), public_id, dimensi, dan relasi album disimpan di Neon DB.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  const method = req.method;

  try {
    // 1. GET: Ambil daftar media asset dari database Neon
    if (method === 'GET') {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const albumId = url.searchParams.get('albumId');

      if (albumId) {
        const media = await prisma.albumMedia.findMany({
          where: { albumId },
          include: { media: true },
          orderBy: { sortOrder: 'asc' },
        });
        return sendSuccess(res, media.map((am) => am.media));
      }

      const allMedia = await prisma.mediaAsset.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return sendSuccess(res, allMedia);
    }

    // 2. POST: Simpan metadata foto hasil upload Cloudinary ke Neon PostgreSQL
    if (method === 'POST') {
      const body = await parseJsonBody(req);
      const {
        cloudinaryPublicId,
        secureUrl,
        originalFilename,
        format,
        bytes,
        width,
        height,
        caption,
        altText,
        albumId,
      } = body;

      if (!secureUrl || !originalFilename) {
        return sendError(res, 400, 'secureUrl dan originalFilename wajib disertakan');
      }

      // Simpan record MediaAsset ke Neon
      const newMedia = await prisma.mediaAsset.create({
        data: {
          cloudinaryPublicId: cloudinaryPublicId || null,
          secureUrl,
          originalFilename,
          format: format || null,
          bytes: bytes ? Number(bytes) : null,
          width: width ? Number(width) : null,
          height: height ? Number(height) : null,
          caption: caption || null,
          altText: altText || null,
          uploadedById: session.userId,
        },
      });

      // Jika diasosiasikan dengan album tertentu, buat relasi AlbumMedia di Neon
      if (albumId) {
        const count = await prisma.albumMedia.count({ where: { albumId } });
        await prisma.albumMedia.create({
          data: {
            albumId,
            mediaId: newMedia.id,
            sortOrder: count + 1,
          },
        });
      }

      // Catat log aktivitas di Neon
      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: 'UPLOAD_PHOTO',
          entityType: 'MediaAsset',
          entityId: newMedia.id,
          summary: `Mengunggah foto: ${originalFilename} ke Cloudinary (URL disimpan di Neon)`,
        },
      });

      return sendSuccess(res, newMedia, 'Metadata media berhasil disimpan ke Neon DB');
    }

    // 3. DELETE: Soft delete foto di Neon PostgreSQL
    if (method === 'DELETE') {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const id = url.searchParams.get('id');

      if (!id) {
        return sendError(res, 400, 'ID media wajib disertakan');
      }

      await prisma.mediaAsset.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return sendSuccess(res, null, 'Media berhasil dihapus dari database');
    }

    return sendError(res, 405, 'Metode tidak diizinkan');
  } catch (err: any) {
    return sendError(res, 500, 'Operasi media gagal', err.message);
  }
}

