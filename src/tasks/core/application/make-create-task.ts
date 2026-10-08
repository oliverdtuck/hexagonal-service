import type { ForGeneratingIds } from '../ports/driven/for-generating-ids.ts';
import type { ForStoringTasks } from '../ports/driven/for-storing-tasks.ts';
import type { CreateTask } from '../ports/driving/for-managing-tasks.ts';

import { ok } from '../../../lib/result.ts';
import { createTask } from '../domain/task.ts';

export interface CreateTaskDependencies {
  generateId: ForGeneratingIds;
  taskStore: ForStoringTasks;
}

export const makeCreateTask =
  ({ generateId, taskStore }: CreateTaskDependencies): CreateTask =>
  async ({ title }) => {
    const result = createTask({ id: generateId(), title });

    if (!result.ok) {
      return result;
    }

    await taskStore.save(result.value);
    return ok(result.value);
  };
