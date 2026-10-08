import { Router } from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { makeApp } from './make-app.ts';

const logLine = z.object({
  msg: z.string(),
  req: z.object({ id: z.string() }).optional(),
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

  const router = Router()
    .get('/', (_req, res) => res.json({ reached: true }))
    .post('/', () => {
      throw new Error('Unexpected');
    });

  return { app: makeApp({ logger, routers: { '/things': router } }), logs };
};

describe('makeApp', () => {
  it('reports health', async () => {
    const response = await request(setup().app).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('mounts each router at its path', async () => {
    const response = await request(setup().app).get('/things').expect(200);

    expect(response.body).toEqual({ reached: true });
  });

  it('parses JSON bodies', async () => {
    await request(setup().app)
      .post('/things')
      .set('content-type', 'application/json')
      .send('{oops')
      .expect(400);
  });

  it('returns 404 for an unknown route', async () => {
    const response = await request(setup().app).get('/unknown').expect(404);

    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('logs unexpected errors with the request id', async () => {
    const { app, logs } = setup();

    await request(app)
      .post('/things')
      .set('x-request-id', 'request-1')
      .expect(500);

    expect(logs.find((log) => log.msg === 'Unhandled error')?.req?.id).toBe(
      'request-1',
    );
  });
});
