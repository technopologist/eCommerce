// Single entry point: serves the JSON API under /api and the React app
// from the same process and port.
//   dev  (npm run dev):   Vite runs as middleware with hot reload.
//   prod (npm start):     serves the prebuilt files in dist/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { migrate, pool } from './db.js';
import { api } from './api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');
const port = Number(process.env.PORT) || 5173;

await migrate();

const app = express();
app.disable('x-powered-by');

if (isProd) {
  // Requests reach the app via Cloudflare and Render's load balancer, so
  // X-Forwarded-For looks like "client, cloudflare, render-lb". Trusting
  // exactly those 3 hops makes req.ip the real client (used for rate
  // limiting) while ignoring any addresses a client prepends itself.
  // Verified on Render 2026-11; override with TRUST_PROXY_HOPS if the
  // hosting path changes.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 3);
  // Security headers incl. a strict Content-Security-Policy and HSTS.
  // Skipped in dev, where Vite's hot-reload needs inline scripts.
  app.use(helmet());
}

app.use('/api', express.json({ limit: '100kb' }), api);

if (isProd) {
  const dist = path.join(root, 'dist');
  // Hashed assets never change, so let browsers cache them for a year.
  app.use('/assets', express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(dist, { index: false }));
  // Client-side routes (e.g. /product/p1) all load the SPA shell.
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

const server = app.listen(port, () => {
  console.log(`ShopEase ${isProd ? '(production)' : '(dev)'} running at http://localhost:${port}`);
});

// Render sends SIGTERM on deploys/restarts: finish in-flight requests,
// close DB connections, then exit.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
