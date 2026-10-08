import { describe, expect, it } from 'vitest';

import type { Task } from '../domain/task.ts';

import { makeInMemoryTaskStore } from '../../adapters/driven/persistence/make-in-memory-task-store.ts';
import { makeListTasks } from './make-list-tasks.ts';

const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

const setup = () => {
  const taskStore = makeInMemoryTaskStore();
  return { listTasks: makeListTasks({ taskStore }), taskStore };
};

describe('makeListTasks', () => {
  it('returns an empty list when there are no tasks', async () => {
    const { listTasks } = setup();

    await expect(listTasks()).resolves.toEqual({ ok: true, value: [] });
  });

  it('returns every task', async () => {
    const { listTasks, taskStore } = setup();
    await taskStore.save(task);

    await expect(listTasks()).resolves.toEqual({ ok: true, value: [task] });
  });
});
