import express from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { makeRequestLogger } from './make-request-logger.ts';

const logLine = z.object({
  level: z.number(),
  msg: z.string(),
  req: z.object({ headers: z.record(z.string(), z.string()) }).optional(),
});

const setup = () => {
  const logs: z.infer<typeof logLine>[] = [];
  const logger = pino(
    {},
    {
      write: (line: string) => {
        logs.push(logLine.parse(JSON.parse(line)));
      },
    },
  );

  const app = express()
    .use(makeRequestLogger({ logger }))
    .get('/health', (_req, res) => res.sendStatus(200))
    .get('/ok', (_req, res) => res.sendStatus(200))
    .get('/missing', (_req, res) => res.sendStatus(404))
    .get('/broken', (_req, res) => res.sendStatus(500));

  return { app, logs };
};

describe('makeRequestLogger', () => {
  it.each([
    ['/ok', 30, 'request completed'],
    ['/missing', 40, 'request completed'],
    ['/broken', 50, 'request errored'],
  ])('logs %s at level %i', async (path, level, msg) => {
    const { app, logs } = setup();

    await request(app).get(path);

    expect(logs).toMatchObject([{ level, msg }]);
  });

  it('does not log health checks', async () => {
    const { app, logs } = setup();

    await request(app).get('/health');

    expect(logs).toEqual([]);
  });

  it('generates a request id and returns it', async () => {
    const { app } = setup();

    const response = await request(app).get('/ok');

    expect(response.headers['x-request-id']).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
    );
  });

  it('reuses an incoming request id', async () => {
    const { app } = setup();

    const response = await request(app)
      .get('/ok')
      .set('x-request-id', 'request-1');

    expect(response.headers['x-request-id']).toBe('request-1');
  });

  it('redacts credentials', async () => {
    const { app, logs } = setup();

    await request(app)
      .get('/ok')
      .set('authorization', 'Bearer secret-token')
      .set('cookie', 'session=secret-session');

    expect(logs[0]?.req?.headers).toMatchObject({
      authorization: '[Redacted]',
      cookie: '[Redacted]',
    });
  });
});
