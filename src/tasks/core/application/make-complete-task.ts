import type { ForStoringTasks } from '../ports/driven/for-storing-tasks.ts';

import { err, ok } from '../../../lib/result.ts';
import { completeTask } from '../domain/task.ts';
import {
  type CompleteTask,
  taskNotFoundError,
} from '../ports/driving/for-managing-tasks.ts';

export interface CompleteTaskDependencies {
  taskStore: ForStoringTasks;
}

export const makeCompleteTask =
  ({ taskStore }: CompleteTaskDependencies): CompleteTask =>
  async ({ id }) => {
    const task = await taskStore.findById(id);

    if (!task) {
      return err(taskNotFoundError(id));
    }

    const result = completeTask(task);

    if (!result.ok) {
      return result;
    }

    await taskStore.save(result.value);
    return ok(result.value);
  };
