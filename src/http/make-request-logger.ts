import type { Logger } from 'pino';

import { randomUUID } from 'node:crypto';
import { type HttpLogger, pinoHttp } from 'pino-http';

export interface RequestLoggerDependencies {
  logger: Logger;
}

export const makeRequestLogger = ({
  logger,
}: RequestLoggerDependencies): HttpLogger =>
  pinoHttp({
    autoLogging: { ignore: (req) => req.url === '/health' },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }

      return res.statusCode >= 400 ? 'warn' : 'info';
    },
    // Reuse the caller's request ID so one ID follows a request across services
    genReqId: (req, res) => {
      const incomingId = req.headers['x-request-id'];
      const id =
        typeof incomingId === 'string' && incomingId !== ''
          ? incomingId
          : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    logger: logger.child(
      {},
      {
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
      },
    ),
  });
