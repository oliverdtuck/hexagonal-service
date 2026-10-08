import { describe, expect, it } from 'vitest';

import {
  completeTask,
  createTask,
  invalidTaskTitleError,
  renameTask,
  type Task,
  taskAlreadyCompletedError,
} from './task.ts';

describe('createTask', () => {
  it('creates an incomplete task with a trimmed title', () => {
    expect(createTask({ id: 'task-1', title: '  Write tests  ' })).toEqual({
      ok: true,
      value: { completed: false, id: 'task-1', title: 'Write tests' },
    });
  });

  it.each(['', '   '])(
    'returns InvalidTaskTitle for a blank title (%j)',
    (title) => {
      expect(createTask({ id: 'task-1', title })).toEqual({
        error: invalidTaskTitleError(200),
        ok: false,
      });
    },
  );

  it('accepts a title of 200 characters', () => {
    expect(createTask({ id: 'task-1', title: 'a'.repeat(200) }).ok).toBe(true);
  });

  it('returns InvalidTaskTitle for a title over 200 characters', () => {
    expect(createTask({ id: 'task-1', title: 'a'.repeat(201) })).toEqual({
      error: invalidTaskTitleError(200),
      ok: false,
    });
  });
});

describe('completeTask', () => {
  const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

  it('completes the task without changing the original', () => {
    expect(completeTask(task)).toEqual({
      ok: true,
      value: { ...task, completed: true },
    });
    expect(task.completed).toBe(false);
  });

  it('returns TaskAlreadyCompleted for a completed task', () => {
    expect(completeTask({ ...task, completed: true })).toEqual({
      error: taskAlreadyCompletedError('task-1'),
      ok: false,
    });
  });
});

describe('renameTask', () => {
  const task: Task = { completed: false, id: 'task-1', title: 'Write tests' };

  it('renames the task with a trimmed title without changing the original', () => {
    expect(renameTask(task, '  Ship it  ')).toEqual({
      ok: true,
      value: { ...task, title: 'Ship it' },
    });
    expect(task.title).toBe('Write tests');
  });

  it('renames a completed task', () => {
    expect(renameTask({ ...task, completed: true }, 'Ship it')).toEqual({
      ok: true,
      value: { ...task, completed: true, title: 'Ship it' },
    });
  });

  it.each(['', '   ', 'a'.repeat(201)])(
    'returns InvalidTaskTitle for an invalid title (%j)',
    (title) => {
      expect(renameTask(task, title)).toEqual({
        error: invalidTaskTitleError(200),
        ok: false,
      });
    },
  );
});
