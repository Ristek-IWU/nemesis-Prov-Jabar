import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createStream } from 'rotating-file-stream';
import { createApp } from './src/backend/app.js';
import { openDatabase, resolveRuntimeDbPath } from './src/backend/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const runtimeDbPath = await resolveRuntimeDbPath();
  const db = await openDatabase({ dbPath: runtimeDbPath, readonly: true });
  const { app: apiApp } = await createApp(db);
  const app = express();

  // Setup logging (console + rotating file)
  try {
    const logDirectory = path.join(__dirname, 'logs');
    fs.mkdirSync(logDirectory, { recursive: true });
    const accessLogStream = createStream('access.log', {
      interval: '1d', // rotate daily
      path: logDirectory,
    });
    app.use(morgan('combined', { stream: accessLogStream }));
  } catch (e) {
    // ignore
  }

  // Always log to console for real-time visibility
  app.use(morgan('dev'));

  // Mount API app (routes under /api)
  app.use('/', apiApp);

  // Serve static frontend (built with Vite -> dist)
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));

    // SPA fallback: return index.html for non-API GET requests
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server is ready!`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`[Worker] Orchestrator listening on port ${PORT}`);
    console.log(`[Worker] Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`[Worker] SQLite database: ${runtimeDbPath}`);
    console.log('[Worker] Waiting for requests...\n');
  });

  // Track server activity
  server.on('error', (err) => {
    console.error('[Server] Error:', err);
  });

  server.on('clientError', (err, socket) => {
    console.error('[Server] Client error:', err);
  });

  // Graceful shutdown
  function shutdown(signal) {
    console.log(`\n[Worker] ${signal} received, shutting down...`);
    server.close(() => {
      try { db.close(); } catch {}
      console.log('[Worker] Server closed. Exiting.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Worker] Force closing...');
      process.exit(1);
    }, 5000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Worker] Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[Worker] Uncaught Exception:', err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
