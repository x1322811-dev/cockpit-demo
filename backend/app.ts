import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chatRouter } from './routes/chat.ts';

type CreateAppOptions = {
  staticRoot?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultStaticRoot = path.resolve(__dirname, '../frontend/dist');

function getAllowedOrigins(): Array<string | RegExp> {
  const configured = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) ?? [];

  return [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/, ...configured];
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(cors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'DELETE'],
  }));
  app.use(express.json());

  app.use('/chat', chatRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const staticRoot = options.staticRoot ?? defaultStaticRoot;
  if (existsSync(path.join(staticRoot, 'index.html'))) {
    app.use(express.static(staticRoot));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(staticRoot, 'index.html'));
    });
  }

  return app;
}
