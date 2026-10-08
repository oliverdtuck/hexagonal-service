import type { Task } from '../../../core/domain/task.ts';
import type { ForStoringTasks } from '../../../core/ports/driven/for-storing-tasks.ts';

export const makeInMemoryTaskStore = (): ForStoringTasks => {
  const tasks = new Map<string, Task>();

  return {
    findAll: () => Promise.resolve([...tasks.values()]),
    findById: (id) => Promise.resolve(tasks.get(id)),
    save: (task) => {
      tasks.set(task.id, task);
      return Promise.resolve();
    },
  };
};
