import type { ErrorRequestHandler } from 'express';

import createHttpError from 'http-errors';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  // Raised by Express itself, such as for a malformed JSON body
  if (createHttpError.isHttpError(err) && err.expose) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  req.log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
};
