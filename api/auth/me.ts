import type { IncomingMessage, ServerResponse } from 'http';
import { getSession } from '../_lib/auth';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  const session = getSession(req);
  if (!session) {
    return sendError(res, 401, 'Sesi tidak valid atau telah berakhir');
  }

  return sendSuccess(res, {
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}

