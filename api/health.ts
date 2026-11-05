import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  const diagnostics: Record<string, any> = {
    time: new Date().toISOString(),
    node: process.version,
  };

  // Test 1: bcryptjs
  try {
    const bcrypt = await import('bcryptjs');
    const b = (bcrypt as any).default || bcrypt;
    const hash = await b.hash('test', 10);
    diagnostics.bcrypt = { ok: true, hashLen: hash.length };
  } catch (err: any) {
    diagnostics.bcrypt = { ok: false, error: err.message, stack: err.stack };
  }

  // Test 2: jsonwebtoken
  try {
    const jwt = await import('jsonwebtoken');
    const j = (jwt as any).default || jwt;
    const token = j.sign({ ping: true }, 'secret');
    diagnostics.jwt = { ok: true, tokenLen: token.length };
  } catch (err: any) {
    diagnostics.jwt = { ok: false, error: err.message, stack: err.stack };
  }

  // Test 3: Prisma
  try {
    const prismaModule = await import('./_lib/prisma');
    const prisma = prismaModule.default || prismaModule.prisma;
    const count = await prisma.user.count();
    diagnostics.prisma = { ok: true, userCount: count };
  } catch (err: any) {
    diagnostics.prisma = { ok: false, error: err.message, stack: err.stack };
  }

  res.statusCode = 200;
  res.end(JSON.stringify(diagnostics, null, 2));
}
