import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { makeApp } from '../../../../http/make-app.ts';
import { err, ok } from '../../../../lib/result.ts';
import {
  invalidTaskTitleError,
  taskAlreadyCompletedError,
} from '../../../core/domain/task.ts';
import { makeTasks } from '../../../core/make-tasks.ts';
import {
  type CompleteTask,
  type CreateTask,
  type ForManagingTasks,
  type GetTask,
  type ListTasks,
  type RenameTask,
  taskNotFoundError,
} from '../../../core/ports/driving/for-managing-tasks.ts';
import { makeInMemoryTaskStore } from '../../driven/persistence/make-in-memory-task-store.ts';
import { makeTasksRouter } from './make-tasks-router.ts';

const taskId = '00000000-0000-4000-8000-000000000001';
const task = { completed: false, id: 'task-1', title: 'Write tests' };

/** The tasks router on the real core, with an in-memory store. */
const setupWithCore = () =>
  makeApp({
    logger: pino({ level: 'silent' }),
    routers: {
      '/tasks': makeTasksRouter(
        makeTasks({
          generateId: () => taskId,
          taskStore: makeInMemoryTaskStore(),
        }),
      ),
    },
  });

/** The tasks router on stubbed use cases, which succeed unless a test overrides them. */
const setupWithStubs = (overrides: Partial<ForManagingTasks> = {}) => {
  const dependencies: ForManagingTasks = {
    completeTask: vi.fn<CompleteTask>(() =>
      Promise.resolve(ok({ ...task, completed: true })),
    ),
    createTask: vi.fn<CreateTask>(() => Promise.resolve(ok(task))),
    getTask: vi.fn<GetTask>(() => Promise.resolve(ok(task))),
    listTasks: vi.fn<ListTasks>(() => Promise.resolve(ok([task]))),
    renameTask: vi.fn<RenameTask>(() =>
      Promise.resolve(ok({ ...task, title: 'Ship it' })),
    ),
    ...overrides,
  };
  const app = makeApp({
    logger: pino({ level: 'silent' }),
    routers: { '/tasks': makeTasksRouter(dependencies) },
  });
  return { app, dependencies };
};

describe('with the real core', () => {
  it('creates, reads, lists and completes a task', async () => {
    const app = setupWithCore();
    const task = { completed: false, id: taskId, title: 'Write tests' };

    await request(app)
      .post('/tasks')
      .send({ title: '  Write tests  ' })
      .expect(201, task);
    await request(app).get(`/tasks/${taskId}`).expect(200, task);
    await request(app).get('/tasks').expect(200, [task]);
    await request(app)
      .post(`/tasks/${taskId}/complete`)
      .expect(200, { ...task, completed: true });
  });

  it('renames a task', async () => {
    const app = setupWithCore();
    await request(app)
      .post('/tasks')
      .send({ title: 'Write tests' })
      .expect(201);

    await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: '  Ship it  ' })
      .expect(200, { completed: false, id: taskId, title: 'Ship it' });
    await request(app)
      .get(`/tasks/${taskId}`)
      .expect(200, { completed: false, id: taskId, title: 'Ship it' });
  });

  it('rejects completing a task twice', async () => {
    const app = setupWithCore();
    await request(app)
      .post('/tasks')
      .send({ title: 'Write tests' })
      .expect(201);
    await request(app).post(`/tasks/${taskId}/complete`).expect(200);

    const response = await request(app)
      .post(`/tasks/${taskId}/complete`)
      .expect(422);

    expect(response.body).toEqual({
      error: `Task ${taskId} is already completed`,
    });
  });

  it('returns 404 for an unknown task', async () => {
    await request(setupWithCore()).get('/tasks/unknown').expect(404);
  });

  it('rejects an invalid title', async () => {
    await request(setupWithCore())
      .post('/tasks')
      .send({ title: ' ' })
      .expect(422);
  });
});

describe('validation and error mapping, with stubbed use cases', () => {
  describe('POST /tasks', () => {
    it('returns 400 with the issue path when the title is missing', async () => {
      const { app, dependencies } = setupWithStubs();

      const response = await request(app).post('/tasks').send({}).expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid request',
        issues: [{ path: ['body', 'title'] }],
      });
      expect(dependencies.createTask).not.toHaveBeenCalled();
    });

    it('returns 422 for InvalidTaskTitle', async () => {
      const { app } = setupWithStubs({
        createTask: () => Promise.resolve(err(invalidTaskTitleError(200))),
      });

      const response = await request(app)
        .post('/tasks')
        .send({ title: ' ' })
        .expect(422);

      expect(response.body).toEqual({
        error: invalidTaskTitleError(200).message,
      });
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns 404 for TaskNotFound', async () => {
      const { app } = setupWithStubs({
        getTask: ({ id }) => Promise.resolve(err(taskNotFoundError(id))),
      });

      const response = await request(app).get('/tasks/unknown').expect(404);

      expect(response.body).toEqual({
        error: taskNotFoundError('unknown').message,
      });
    });
  });

  describe('POST /tasks/:id/complete', () => {
    it('returns 422 for TaskAlreadyCompleted', async () => {
      const { app } = setupWithStubs({
        completeTask: ({ id }) =>
          Promise.resolve(err(taskAlreadyCompletedError(id))),
      });

      const response = await request(app)
        .post('/tasks/task-1/complete')
        .expect(422);

      expect(response.body).toEqual({
        error: taskAlreadyCompletedError('task-1').message,
      });
    });

    it('returns 404 for TaskNotFound', async () => {
      const { app } = setupWithStubs({
        completeTask: ({ id }) => Promise.resolve(err(taskNotFoundError(id))),
      });

      const response = await request(app)
        .post('/tasks/unknown/complete')
        .expect(404);

      expect(response.body).toEqual({
        error: taskNotFoundError('unknown').message,
      });
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('returns 400 with the issue path when the title is missing', async () => {
      const { app, dependencies } = setupWithStubs();

      const response = await request(app)
        .patch('/tasks/task-1')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid request',
        issues: [{ path: ['body', 'title'] }],
      });
      expect(dependencies.renameTask).not.toHaveBeenCalled();
    });

    it('returns 422 for InvalidTaskTitle', async () => {
      const { app } = setupWithStubs({
        renameTask: () => Promise.resolve(err(invalidTaskTitleError(200))),
      });

      const response = await request(app)
        .patch('/tasks/task-1')
        .send({ title: ' ' })
        .expect(422);

      expect(response.body).toEqual({
        error: invalidTaskTitleError(200).message,
      });
    });

    it('returns 404 for TaskNotFound', async () => {
      const { app } = setupWithStubs({
        renameTask: ({ id }) => Promise.resolve(err(taskNotFoundError(id))),
      });

      const response = await request(app)
        .patch('/tasks/unknown')
        .send({ title: 'Ship it' })
        .expect(404);

      expect(response.body).toEqual({
        error: taskNotFoundError('unknown').message,
      });
    });
  });
});
