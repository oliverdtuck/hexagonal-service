import { describe, expect, it } from 'vitest';

import type { Task } from '../domain/task.ts';

import { makeInMemoryTaskStore } from '../../adapters/driven/persistence/make-in-memory-task-store.ts';
import { taskNotFoundError } from '../ports/driving/for-managing-tasks.ts';
import { makeGetTask } from './make-get-task.ts';

const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

const setup = async () => {
  const taskStore = makeInMemoryTaskStore();
  await taskStore.save(task);
  return { getTask: makeGetTask({ taskStore }) };
};

describe('makeGetTask', () => {
  it('returns the task', async () => {
    const { getTask } = await setup();

    await expect(getTask({ id: 'task-1' })).resolves.toEqual({
      ok: true,
      value: task,
    });
  });

  it('returns TaskNotFound for an unknown id', async () => {
    const { getTask } = await setup();

    await expect(getTask({ id: 'unknown' })).resolves.toEqual({
      error: taskNotFoundError('unknown'),
      ok: false,
    });
  });
});
