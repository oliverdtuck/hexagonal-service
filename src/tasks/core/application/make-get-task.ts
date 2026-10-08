import type { ForStoringTasks } from '../ports/driven/for-storing-tasks.ts';

import { err, ok } from '../../../lib/result.ts';
import {
  type GetTask,
  taskNotFoundError,
} from '../ports/driving/for-managing-tasks.ts';

export interface GetTaskDependencies {
  taskStore: ForStoringTasks;
}

export const makeGetTask =
  ({ taskStore }: GetTaskDependencies): GetTask =>
  async ({ id }) => {
    const task = await taskStore.findById(id);

    if (!task) {
      return err(taskNotFoundError(id));
    }

    return ok(task);
  };
