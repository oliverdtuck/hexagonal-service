import express from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { errorHandler } from './error-handler.ts';

/** An app whose only route throws the given error, with req.log set as the request logger would. */
const setup = (error: unknown) => {
  const logger = pino({ level: 'silent' });
  const logError = vi.spyOn(logger, 'error');

  const app = express()
    .use((req, _res, next) => {
      req.log = logger;
      next();
    })
    .use(express.json())
    .post('/', () => {
      throw error;
    })
    .use(errorHandler);

  return { app, logError };
};

describe('errorHandler', () => {
  it('returns errors raised by Express with their status, such as malformed JSON', async () => {
    const { app, logError } = setup(new Error('unreachable'));

    await request(app)
      .post('/')
      .set('content-type', 'application/json')
      .send('{oops')
      .expect(400);

    expect(logError).not.toHaveBeenCalled();
  });

  it('hides unexpected errors behind a 500 and logs them', async () => {
    const error = new Error('Database password is hunter2');
    const { app, logError } = setup(error);

    const response = await request(app).post('/').expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
    expect(logError).toHaveBeenCalledWith({ err: error }, 'Unhandled error');
  });
});
