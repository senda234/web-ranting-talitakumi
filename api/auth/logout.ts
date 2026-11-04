import type { IncomingMessage, ServerResponse } from 'http';
import { clearSessionCookie } from '../_lib/auth';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  clearSessionCookie(res);
  return sendSuccess(res, null, 'Logout berhasil');
}

