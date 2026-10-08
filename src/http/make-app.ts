import type { Logger } from 'pino';

import express, { type Express, type Router } from 'express';

import { errorHandler } from './error-handler.ts';
import { makeRequestLogger } from './make-request-logger.ts';
import { notFoundHandler } from './not-found-handler.ts';

export interface AppDependencies {
  logger: Logger;
  /** Each router, keyed by the path it is mounted at. */
  routers: Readonly<Record<string, Router>>;
}

export const makeApp = ({ logger, routers }: AppDependencies): Express => {
  const app = express();

  app.disable('x-powered-by');
  // First, so every later handler (including the error handler) has req.log
  app.use(makeRequestLogger({ logger }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  for (const [path, router] of Object.entries(routers)) {
    app.use(path, router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
