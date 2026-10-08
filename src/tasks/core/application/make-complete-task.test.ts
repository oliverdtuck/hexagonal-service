import { describe, expect, it } from 'vitest';

import { makeInMemoryTaskStore } from '../../adapters/driven/persistence/make-in-memory-task-store.ts';
import { type Task, taskAlreadyCompletedError } from '../domain/task.ts';
import { taskNotFoundError } from '../ports/driving/for-managing-tasks.ts';
import { makeCompleteTask } from './make-complete-task.ts';

const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

const setup = async ({ completed = false } = {}) => {
  const taskStore = makeInMemoryTaskStore();
  await taskStore.save({ ...task, completed });
  return { completeTask: makeCompleteTask({ taskStore }), taskStore };
};

describe('makeCompleteTask', () => {
  it('completes and saves the task', async () => {
    const { completeTask, taskStore } = await setup();

    await expect(completeTask({ id: 'task-1' })).resolves.toEqual({
      ok: true,
      value: { ...task, completed: true },
    });
    await expect(taskStore.findById('task-1')).resolves.toEqual({
      ...task,
      completed: true,
    });
  });

  it('returns TaskAlreadyCompleted for a completed task', async () => {
    const { completeTask } = await setup({ completed: true });

    await expect(completeTask({ id: 'task-1' })).resolves.toEqual({
      error: taskAlreadyCompletedError('task-1'),
      ok: false,
    });
  });

  it('returns TaskNotFound for an unknown id', async () => {
    const { completeTask } = await setup();

    await expect(completeTask({ id: 'unknown' })).resolves.toEqual({
      error: taskNotFoundError('unknown'),
      ok: false,
    });
  });
});
