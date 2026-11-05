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
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
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

export async function getSession(req: IncomingMessage): Promise<SessionPayload | null> {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) {
    // 1. Verifikasi instan berbasis JWT
    const payload = verifyToken(token);
    if (payload) return payload;

    // 2. Fallback: Jika token adalah token sesi raw hex di database Neon
    try {
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const prismaModule = await import('./prisma.js');
      const prisma = prismaModule.default;
      const dbSession = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (
        dbSession &&
        dbSession.expiresAt > new Date() &&
        dbSession.user.isActive &&
        dbSession.user.status !== 'DISABLED'
      ) {
        return {
          userId: dbSession.user.id,
          email: dbSession.user.email,
          role: dbSession.user.role as any,
          name: dbSession.user.name,
        };
      }
    } catch {
      // ignore
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.substring(7));
    if (payload) return payload;
  }

  // Fallback untuk development / admin header
  if (req.headers['x-admin-auth'] === 'true') {
    try {
      const prismaModule = await import('./prisma.js');
      const prisma = prismaModule.default;
      const adminUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN', isActive: true },
      });
      if (adminUser) {
        return {
          userId: adminUser.id,
          email: adminUser.email,
          role: 'SUPER_ADMIN',
          name: adminUser.name,
        };
      }
    } catch {
      // ignore
    }
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

