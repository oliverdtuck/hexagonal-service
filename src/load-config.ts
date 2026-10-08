import type { LevelWithSilent } from 'pino';

import { z } from 'zod';

const envSchema = z.object({
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PORT: z.coerce.number().int().min(0).max(65_535).default(3000),
});

export interface Config {
  logLevel: LevelWithSilent;
  port: number;
}

export const loadConfig = (): Config => {
  const env = envSchema.parse(process.env);
  return { logLevel: env.LOG_LEVEL, port: env.PORT };
};
