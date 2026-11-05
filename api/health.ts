import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  const diagnostics: Record<string, any> = {
    time: new Date().toISOString(),
    node: process.version,
    cwd: process.cwd(),
  };

  try {
    diagnostics.filesAtRoot = fs.readdirSync(process.cwd());
  } catch (e: any) {
    diagnostics.filesAtRoot = e.message;
  }

  try {
    diagnostics.filesAtApi = fs.readdirSync(path.join(process.cwd(), 'api'));
  } catch (e: any) {
    diagnostics.filesAtApi = e.message;
  }

  try {
    diagnostics.filesAtApiLib = fs.readdirSync(path.join(process.cwd(), 'api', '_lib'));
  } catch (e: any) {
    diagnostics.filesAtApiLib = e.message;
  }

  // Test with .js extension
  try {
    const prismaModule = await import('./_lib/prisma.js');
    const prisma = prismaModule.default || prismaModule.prisma;
    const count = await prisma.user.count();
    diagnostics.prismaWithJs = { ok: true, userCount: count };
  } catch (err: any) {
    diagnostics.prismaWithJs = { ok: false, error: err.message, stack: err.stack };
  }

  res.statusCode = 200;
  res.end(JSON.stringify(diagnostics, null, 2));
}
