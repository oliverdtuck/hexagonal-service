import type { ForGeneratingIds } from './ports/driven/for-generating-ids.ts';
import type { ForStoringTasks } from './ports/driven/for-storing-tasks.ts';
import type { ForManagingTasks } from './ports/driving/for-managing-tasks.ts';

import { makeCompleteTask } from './application/make-complete-task.ts';
import { makeCreateTask } from './application/make-create-task.ts';
import { makeGetTask } from './application/make-get-task.ts';
import { makeListTasks } from './application/make-list-tasks.ts';
import { makeRenameTask } from './application/make-rename-task.ts';

export interface TasksDependencies {
  generateId: ForGeneratingIds;
  taskStore: ForStoringTasks;
}

/** Builds the tasks hexagon from its driven adapters, exposed through its driving port. */
export const makeTasks = ({
  generateId,
  taskStore,
}: TasksDependencies): ForManagingTasks => ({
  completeTask: makeCompleteTask({ taskStore }),
  createTask: makeCreateTask({ generateId, taskStore }),
  getTask: makeGetTask({ taskStore }),
  listTasks: makeListTasks({ taskStore }),
  renameTask: makeRenameTask({ taskStore }),
});
