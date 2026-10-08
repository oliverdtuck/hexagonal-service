import type { TypedError } from '../../../lib/typed-error.ts';

import { err, ok, type Result } from '../../../lib/result.ts';

export interface InvalidTaskTitleError extends TypedError<'InvalidTaskTitle'> {
  readonly maxLength: number;
}

export interface Task {
  readonly completed: boolean;
  readonly id: string;
  readonly title: string;
}

export interface TaskAlreadyCompletedError extends TypedError<'TaskAlreadyCompleted'> {
  readonly id: string;
}

export const invalidTaskTitleError = (
  maxLength: number,
): InvalidTaskTitleError => ({
  maxLength,
  message: `Task title must be between 1 and ${String(maxLength)} characters`,
  type: 'InvalidTaskTitle',
});

export const taskAlreadyCompletedError = (
  id: string,
): TaskAlreadyCompletedError => ({
  id,
  message: `Task ${id} is already completed`,
  type: 'TaskAlreadyCompleted',
});

const MAX_TITLE_LENGTH = 200;

/** A title is trimmed, then must be between 1 and MAX_TITLE_LENGTH characters. */
const toValidTitle = (title: string): Result<string, InvalidTaskTitleError> => {
  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0 || trimmedTitle.length > MAX_TITLE_LENGTH) {
    return err(invalidTaskTitleError(MAX_TITLE_LENGTH));
  }

  return ok(trimmedTitle);
};

export const createTask = ({
  id,
  title,
}: Pick<Task, 'id' | 'title'>): Result<Task, InvalidTaskTitleError> => {
  const result = toValidTitle(title);

  if (!result.ok) {
    return result;
  }

  return ok({ completed: false, id, title: result.value });
};

export const renameTask = (
  task: Task,
  title: string,
): Result<Task, InvalidTaskTitleError> => {
  const result = toValidTitle(title);

  if (!result.ok) {
    return result;
  }

  return ok({ ...task, title: result.value });
};

export const completeTask = (
  task: Task,
): Result<Task, TaskAlreadyCompletedError> => {
  if (task.completed) {
    return err(taskAlreadyCompletedError(task.id));
  }

  return ok({ ...task, completed: true });
};
