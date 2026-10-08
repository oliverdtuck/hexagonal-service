import type { RequestHandler } from 'express';

import type { ListTasks } from '../../../core/ports/driving/for-managing-tasks.ts';

import { toTaskResponse } from './to-task-response.ts';

export interface ListTasksHandlerDependencies {
  listTasks: ListTasks;
}

export const makeListTasksHandler =
  ({ listTasks }: ListTasksHandlerDependencies): RequestHandler =>
  async (_req, res) => {
    const result = await listTasks();
    res.json(result.value.map(toTaskResponse));
  };
