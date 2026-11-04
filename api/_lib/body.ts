import type { IncomingMessage } from 'http';

export function parseJsonBody<T = any>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        if (!body) {
          resolve({} as T);
        } else {
          resolve(JSON.parse(body) as T);
        }
      } catch (e) {
        reject(new Error('Format JSON tidak valid'));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

