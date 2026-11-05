import type { IncomingMessage } from 'http';

export function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  // 1. Cek apakah Vercel / middleware telah mem-parse req.body sebelumnya
  const preParsed = (req as any).body;
  if (preParsed !== undefined && preParsed !== null) {
    if (typeof preParsed === 'object') {
      return Promise.resolve(preParsed as T);
    }
    if (typeof preParsed === 'string') {
      const trimmed = preParsed.trim();
      if (!trimmed) return Promise.resolve({} as T);
      try {
        return Promise.resolve(JSON.parse(trimmed) as T);
      } catch {
        return Promise.reject(new Error('Format JSON tidak valid'));
      }
    }
  }

  // 2. Jika stream sudah berakhir (readableEnded), jangan tunggu stream event
  if ((req as any).readableEnded) {
    return Promise.resolve({} as T);
  }

  // 3. Fallback: Baca raw stream data untuk lingkungan lokal / standard Node.js
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const trimmed = body.trim();
        if (!trimmed) {
          resolve({} as T);
        } else {
          resolve(JSON.parse(trimmed) as T);
        }
      } catch {
        reject(new Error('Format JSON tidak valid'));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}
