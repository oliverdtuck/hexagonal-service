import type { Task } from '../../domain/task.ts';

export interface ForStoringTasks {
  findAll: () => Promise<readonly Task[]>;
  findById: (id: string) => Promise<Task | undefined>;
  save: (task: Task) => Promise<void>;
}
