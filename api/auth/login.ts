import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import prisma from '../_lib/prisma';
import { parseJsonBody } from '../_lib/body';
import { signToken, setSessionCookie } from '../_lib/auth';
import { sendSuccess, sendError } from '../_lib/response';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Metode tidak diizinkan');
  }

  try {
    const { email, password } = await parseJsonBody(req);

    if (!email || !password) {
      return sendError(res, 400, 'Email dan kata sandi wajib diisi');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      return sendError(res, 401, 'Email atau kata sandi tidak sesuai');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Email atau kata sandi tidak sesuai');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    setSessionCookie(res, token);

    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 'Login berhasil');
  } catch (err: any) {
    return sendError(res, 500, 'Terjadi kesalahan sistem saat autentikasi', err.message);
  }
}

