import { randomUUID } from 'node:crypto';
import { pino } from 'pino';

import { makeApp } from './http/make-app.ts';
import { loadConfig } from './load-config.ts';
import { makeInMemoryTaskStore } from './tasks/adapters/driven/persistence/make-in-memory-task-store.ts';
import { makeTasksRouter } from './tasks/adapters/driving/http/make-tasks-router.ts';
import { makeTasks } from './tasks/core/make-tasks.ts';

const config = loadConfig();

const logger = pino({ level: config.logLevel });

const tasks = makeTasks({
  generateId: randomUUID,
  taskStore: makeInMemoryTaskStore(),
});

const app = makeApp({
  logger,
  routers: { '/tasks': makeTasksRouter(tasks) },
});

const server = app.listen(config.port, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'Failed to start');
    process.exitCode = 1;
    return;
  }

  logger.info({ port: config.port }, 'Listening');
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'Shutting down');

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, 'Failed to shut down cleanly');
      process.exitCode = 1;
    }
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
