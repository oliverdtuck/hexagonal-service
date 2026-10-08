import type { RequestHandler } from 'express';

import { match } from 'ts-pattern';
import { z } from 'zod';

import type { GetTask } from '../../../core/ports/driving/for-managing-tasks.ts';

import { toTaskResponse } from './to-task-response.ts';

const requestSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export interface GetTaskHandlerDependencies {
  getTask: GetTask;
}

export const makeGetTaskHandler =
  ({ getTask }: GetTaskHandlerDependencies): RequestHandler =>
  async (req, res) => {
    const request = requestSchema.safeParse(req);

    if (!request.success) {
      res
        .status(400)
        .json({ error: 'Invalid request', issues: request.error.issues });
      return;
    }

    const result = await getTask({ id: request.data.params.id });

    if (!result.ok) {
      const status = match(result.error)
        .with({ type: 'TaskNotFound' }, () => 404)
        .exhaustive();

      res.status(status).json({ error: result.error.message });
      return;
    }

    res.status(200).json(toTaskResponse(result.value));
  };
