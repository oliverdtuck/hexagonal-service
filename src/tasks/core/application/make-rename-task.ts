import type { ForStoringTasks } from '../ports/driven/for-storing-tasks.ts';

import { err, ok } from '../../../lib/result.ts';
import { renameTask } from '../domain/task.ts';
import {
  type RenameTask,
  taskNotFoundError,
} from '../ports/driving/for-managing-tasks.ts';

export interface RenameTaskDependencies {
  taskStore: ForStoringTasks;
}

export const makeRenameTask =
  ({ taskStore }: RenameTaskDependencies): RenameTask =>
  async ({ id, title }) => {
    const task = await taskStore.findById(id);

    if (!task) {
      return err(taskNotFoundError(id));
    }

    const result = renameTask(task, title);

    if (!result.ok) {
      return result;
    }

    await taskStore.save(result.value);
    return ok(result.value);
  };
