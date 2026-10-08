import { describe, expect, it } from 'vitest';

import type { Task } from '../../../core/domain/task.ts';

import { makeInMemoryTaskStore } from './make-in-memory-task-store.ts';

const firstTask: Task = { completed: false, id: 'task-1', title: 'First' };
const secondTask: Task = { completed: false, id: 'task-2', title: 'Second' };

describe('makeInMemoryTaskStore', () => {
  it('returns undefined for an unknown id', async () => {
    await expect(
      makeInMemoryTaskStore().findById('unknown'),
    ).resolves.toBeUndefined();
  });

  it('finds a saved task by id', async () => {
    const taskStore = makeInMemoryTaskStore();
    await taskStore.save(firstTask);

    await expect(taskStore.findById(firstTask.id)).resolves.toEqual(firstTask);
  });

  it('replaces a task saved again with the same id', async () => {
    const taskStore = makeInMemoryTaskStore();
    await taskStore.save(firstTask);
    await taskStore.save({ ...firstTask, completed: true });

    await expect(taskStore.findById(firstTask.id)).resolves.toEqual({
      ...firstTask,
      completed: true,
    });
  });

  it('lists every saved task', async () => {
    const taskStore = makeInMemoryTaskStore();
    await taskStore.save(firstTask);
    await taskStore.save(secondTask);

    const tasks = await taskStore.findAll();

    expect(tasks).toHaveLength(2);
    expect(tasks).toEqual(expect.arrayContaining([firstTask, secondTask]));
  });
});
