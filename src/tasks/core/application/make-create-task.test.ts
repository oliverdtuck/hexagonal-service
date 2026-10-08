import { describe, expect, it } from 'vitest';

import { makeInMemoryTaskStore } from '../../adapters/driven/persistence/make-in-memory-task-store.ts';
import { invalidTaskTitleError } from '../domain/task.ts';
import { makeCreateTask } from './make-create-task.ts';

const setup = () => {
  const taskStore = makeInMemoryTaskStore();
  const createTask = makeCreateTask({
    generateId: () => 'task-1',
    taskStore,
  });
  return { createTask, taskStore };
};

describe('makeCreateTask', () => {
  it('saves the task and returns it', async () => {
    const { createTask, taskStore } = setup();

    await expect(createTask({ title: 'Write tests' })).resolves.toEqual({
      ok: true,
      value: { completed: false, id: 'task-1', title: 'Write tests' },
    });
    await expect(taskStore.findById('task-1')).resolves.toEqual({
      completed: false,
      id: 'task-1',
      title: 'Write tests',
    });
  });

  it('returns InvalidTaskTitle and saves nothing when the title is invalid', async () => {
    const { createTask, taskStore } = setup();

    await expect(createTask({ title: ' ' })).resolves.toEqual({
      error: invalidTaskTitleError(200),
      ok: false,
    });
    await expect(taskStore.findAll()).resolves.toEqual([]);
  });
});
