import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { getSession } from '../../_lib/auth';
import { parseJsonBody } from '../../_lib/body';
import { sendSuccess, sendError } from '../../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Akses ditolak: autentikasi diperlukan');
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return sendError(res, 500, 'Konfigurasi Cloudinary belum lengkap pada server');
  }

  try {
    const { folder = 'talitakumi/general' } = await parseJsonBody(req);
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    return sendSuccess(res, {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (err: any) {
    return sendError(res, 500, 'Gagal membuat signature Cloudinary', err.message);
  }
}

