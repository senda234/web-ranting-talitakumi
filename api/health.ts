import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');

  const diagnostics: Record<string, any> = {
    time: new Date().toISOString(),
    commit: 'test-auth-import',
  };

  try {
    const authModule = await import('./auth.js');
    diagnostics.authModule = { ok: true, isFunction: typeof authModule.default === 'function' };
  } catch (err: any) {
    diagnostics.authModule = { ok: false, error: err.message, stack: err.stack };
  }

  res.statusCode = 200;
  res.end(JSON.stringify(diagnostics, null, 2));
}
