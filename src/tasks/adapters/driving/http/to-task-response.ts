import type { Task } from '../../../core/domain/task.ts';

/** The public JSON shape of a task. Domain changes don't reach clients unless mapped here. */
export interface TaskResponse {
  completed: boolean;
  id: string;
  title: string;
}

export const toTaskResponse = (task: Task): TaskResponse => ({
  completed: task.completed,
  id: task.id,
  title: task.title,
});
