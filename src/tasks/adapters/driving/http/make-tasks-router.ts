import { Router } from 'express';

import type { ForManagingTasks } from '../../../core/ports/driving/for-managing-tasks.ts';

import { makeCompleteTaskHandler } from './make-complete-task-handler.ts';
import { makeCreateTaskHandler } from './make-create-task-handler.ts';
import { makeGetTaskHandler } from './make-get-task-handler.ts';
import { makeListTasksHandler } from './make-list-tasks-handler.ts';
import { makeRenameTaskHandler } from './make-rename-task-handler.ts';

export const makeTasksRouter = ({
  completeTask,
  createTask,
  getTask,
  listTasks,
  renameTask,
}: ForManagingTasks): Router => {
  const router = Router();

  router.get('/', makeListTasksHandler({ listTasks }));
  router.post('/', makeCreateTaskHandler({ createTask }));
  router.get('/:id', makeGetTaskHandler({ getTask }));
  router.post('/:id/complete', makeCompleteTaskHandler({ completeTask }));
  router.patch('/:id', makeRenameTaskHandler({ renameTask }));

  return router;
};
