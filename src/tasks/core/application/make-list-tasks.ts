import type { ForStoringTasks } from '../ports/driven/for-storing-tasks.ts';
import type { ListTasks } from '../ports/driving/for-managing-tasks.ts';

import { ok } from '../../../lib/result.ts';

export interface ListTasksDependencies {
  taskStore: ForStoringTasks;
}

export const makeListTasks =
  ({ taskStore }: ListTasksDependencies): ListTasks =>
  async () => {
    const tasks = await taskStore.findAll();

    return ok(tasks);
  };
