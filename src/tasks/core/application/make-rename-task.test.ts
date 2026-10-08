import { describe, expect, it } from 'vitest';

import { makeInMemoryTaskStore } from '../../adapters/driven/persistence/make-in-memory-task-store.ts';
import { invalidTaskTitleError, type Task } from '../domain/task.ts';
import { taskNotFoundError } from '../ports/driving/for-managing-tasks.ts';
import { makeRenameTask } from './make-rename-task.ts';

const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

const setup = async () => {
  const taskStore = makeInMemoryTaskStore();
  await taskStore.save(task);
  return { renameTask: makeRenameTask({ taskStore }), taskStore };
};

describe('makeRenameTask', () => {
  it('renames and saves the task', async () => {
    const { renameTask, taskStore } = await setup();

    await expect(
      renameTask({ id: 'task-1', title: 'Ship it' }),
    ).resolves.toEqual({
      ok: true,
      value: { ...task, title: 'Ship it' },
    });
    await expect(taskStore.findById('task-1')).resolves.toEqual({
      ...task,
      title: 'Ship it',
    });
  });

  it('returns InvalidTaskTitle and leaves the task unchanged', async () => {
    const { renameTask, taskStore } = await setup();

    await expect(renameTask({ id: 'task-1', title: ' ' })).resolves.toEqual({
      error: invalidTaskTitleError(200),
      ok: false,
    });
    await expect(taskStore.findById('task-1')).resolves.toEqual(task);
  });

  it('returns TaskNotFound for an unknown id', async () => {
    const { renameTask } = await setup();

    await expect(
      renameTask({ id: 'unknown', title: 'Ship it' }),
    ).resolves.toEqual({
      error: taskNotFoundError('unknown'),
      ok: false,
    });
  });
});
