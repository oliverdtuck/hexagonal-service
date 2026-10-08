import type { Ok, Result } from '../../../../lib/result.ts';
import type { TypedError } from '../../../../lib/typed-error.ts';
import type {
  InvalidTaskTitleError,
  Task,
  TaskAlreadyCompletedError,
} from '../../domain/task.ts';

/** Everything the outside world can ask of the tasks module. */
export interface ForManagingTasks {
  completeTask: CompleteTask;
  createTask: CreateTask;
  getTask: GetTask;
  listTasks: ListTasks;
  renameTask: RenameTask;
}

export interface TaskNotFoundError extends TypedError<'TaskNotFound'> {
  readonly id: string;
}

export const taskNotFoundError = (id: string): TaskNotFoundError => ({
  id,
  message: `Task ${id} not found`,
  type: 'TaskNotFound',
});

export type CompleteTask = (
  command: CompleteTaskCommand,
) => Promise<Result<Task, CompleteTaskError>>;

export interface CompleteTaskCommand {
  id: string;
}

export type CompleteTaskError = TaskAlreadyCompletedError | TaskNotFoundError;

export type CreateTask = (
  command: CreateTaskCommand,
) => Promise<Result<Task, CreateTaskError>>;

export interface CreateTaskCommand {
  title: string;
}

export type CreateTaskError = InvalidTaskTitleError;

export type GetTask = (
  query: GetTaskQuery,
) => Promise<Result<Task, GetTaskError>>;

export type GetTaskError = TaskNotFoundError;

export interface GetTaskQuery {
  id: string;
}

export type ListTasks = () => Promise<Ok<readonly Task[]>>;

export type RenameTask = (
  command: RenameTaskCommand,
) => Promise<Result<Task, RenameTaskError>>;

export interface RenameTaskCommand {
  id: string;
  title: string;
}

export type RenameTaskError = InvalidTaskTitleError | TaskNotFoundError;
