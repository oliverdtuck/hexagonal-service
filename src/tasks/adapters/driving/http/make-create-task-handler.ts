import type { RequestHandler } from 'express';

import { match } from 'ts-pattern';
import { z } from 'zod';

import type { CreateTask } from '../../../core/ports/driving/for-managing-tasks.ts';

import { toTaskResponse } from './to-task-response.ts';

const requestSchema = z.object({
  body: z.object({ title: z.string() }),
});

export interface CreateTaskHandlerDependencies {
  createTask: CreateTask;
}

export const makeCreateTaskHandler =
  ({ createTask }: CreateTaskHandlerDependencies): RequestHandler =>
  async (req, res) => {
    const request = requestSchema.safeParse(req);

    if (!request.success) {
      res
        .status(400)
        .json({ error: 'Invalid request', issues: request.error.issues });
      return;
    }

    const result = await createTask({ title: request.data.body.title });

    if (!result.ok) {
      const status = match(result.error)
        .with({ type: 'InvalidTaskTitle' }, () => 422)
        .exhaustive();

      res.status(status).json({ error: result.error.message });
      return;
    }

    res.status(201).json(toTaskResponse(result.value));
  };
