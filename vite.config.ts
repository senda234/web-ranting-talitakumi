import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

function apiDevPlugin(): Plugin {
  return {
    name: 'vite-plugin-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
          const pathname = urlObj.pathname;

          let filePath = '';

          // 1. Cek exact match: e.g. api/me/sessions.ts, api/admin/users.ts
          const directFile = path.resolve(__dirname, '.' + pathname + '.ts');
          if (fs.existsSync(directFile)) {
            filePath = directFile;
          }

          // 2. Cek api/auth/[action].ts
          if (!filePath && pathname.startsWith('/api/auth/')) {
            const actionFile = path.resolve(__dirname, './api/auth/[action].ts');
            if (fs.existsSync(actionFile)) filePath = actionFile;
          }

          // 3. Cek api/public/[resource].ts
          if (!filePath && pathname.startsWith('/api/public/')) {
            const resourceFile = path.resolve(__dirname, './api/public/[resource].ts');
            if (fs.existsSync(resourceFile)) filePath = resourceFile;
          }

          // 4. Cek api/cloudinary/sign -> api/admin/cloudinary/signature.ts
          if (!filePath && (pathname === '/api/cloudinary/sign' || pathname === '/api/admin/cloudinary/signature')) {
            const signFile = path.resolve(__dirname, './api/admin/cloudinary/signature.ts');
            if (fs.existsSync(signFile)) filePath = signFile;
          }

          // 5. Cek api/admin/security/stats.ts
          if (!filePath && pathname === '/api/admin/security/stats') {
            const statsFile = path.resolve(__dirname, './api/admin/security/stats.ts');
            if (fs.existsSync(statsFile)) filePath = statsFile;
          }

          // 6. Cek api/admin/:name.ts
          if (!filePath && pathname.startsWith('/api/admin/')) {
            const adminFile = path.resolve(__dirname, '.' + pathname + '.ts');
            if (fs.existsSync(adminFile)) filePath = adminFile;
          }

          if (filePath) {
            const mod = await server.ssrLoadModule(filePath);
            if (typeof mod.default === 'function') {
              await mod.default(req, res);
              return;
            }
          }

          next();
        } catch (err: any) {
          console.error('[API Dev Server Error]:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message || 'Internal API Error' }));
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
