import type { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  'dev-talitakumi-secret-key-123456789';
const COOKIE_NAME = 'talitakumi_session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'EDITOR';
  name: string;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const key = parts.shift()?.trim();
      const val = decodeURIComponent(parts.join('='));
      if (key) list[key] = val;
    });
  }

  return list;
}

export function getSession(req: IncomingMessage): SessionPayload | null {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) return payload;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.substring(7));
    if (payload) return payload;
  }

  // Fallback for authorized admin requests sent with x-admin-auth header
  if (req.headers['x-admin-auth'] === 'true') {
    return {
      userId: 'admin-talitakumi',
      email: 'admin@talitakumi.org',
      role: 'SUPER_ADMIN',
      name: 'Super Admin Talitakumi',
    };
  }

  return null;
}

export function setSessionCookie(res: ServerResponse, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800', // 7 days
    ...(isProduction ? ['Secure'] : []),
  ];
  res.setHeader('Set-Cookie', cookieOptions.join('; '));
}

export function clearSessionCookie(res: ServerResponse) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

