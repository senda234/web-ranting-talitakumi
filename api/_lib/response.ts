import type { ServerResponse } from 'http';

export function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function sendSuccess(res: ServerResponse, data: any, message = 'Operasi berhasil') {
  sendJson(res, 200, {
    success: true,
    data,
    message,
  });
}

export function sendError(res: ServerResponse, statusCode: number, message: string, details?: any) {
  sendJson(res, statusCode, {
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
}

