# hexagonal-service

A TypeScript service template that follows Alistair Cockburn's Ports and Adapters (hexagonal) architecture: a technology-free core, ports named for their purpose, and adapters plugged in from a single composition root. Inside the core it borrows from Domain-Driven Design and Clean Architecture, separating domain rules from use cases. Everything is organised into feature modules, and the architecture is enforced by lint rules rather than convention.

It ships with one example module, `tasks`, that shows every part of the structure working end to end over HTTP.

Treat it as a starting point to adapt, not a framework: the example module is there to be copied and replaced.

## Getting started

Requires Node.js 24 or later.

```bash
npm install
npm run dev
```

The service listens on port 3000 by default.

| Variable    | Default | Description                                                           |
| ----------- | ------- | --------------------------------------------------------------------- |
| `LOG_LEVEL` | `info`  | One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `PORT`      | `3000`  | Port the HTTP server listens on                                       |

## Scripts

| Script                  | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `npm run build`         | Compile `src` to `dist`, excluding tests              |
| `npm run dev`           | Run from source, restart on change, pretty-print logs |
| `npm run format`        | Format all files with Prettier                        |
| `npm run format:check`  | Check formatting without writing                      |
| `npm run lint`          | Lint, including the architecture boundary rules       |
| `npm run lint:fix`      | Lint and apply automatic fixes                        |
| `npm start`             | Run the compiled build                                |
| `npm test`              | Run the tests once                                    |
| `npm run test:coverage` | Run the tests and enforce the 80% coverage minimum    |
| `npm run test:watch`    | Run the tests in watch mode                           |
| `npm run typecheck`     | Type-check everything, tests included                 |

## Architecture

Each feature is a module with two zones:

- **The core** holds the business logic and the ports. It contains no technology: no Express, no database, no logger, no Node.js built-ins.
- **Adapters** sit outside the core and translate between a technology and a port. Driving adapters (such as HTTP handlers) call into the core; driven adapters (such as a store) are called by it.

Dependencies only point inward. Adapters depend on the core's ports; the core never knows which adapters exist.

```
src/
├── main.ts                       # composition root: wires everything and runs the process
├── load-config.ts                # environment variables, validated with Zod
├── http/                         # the HTTP host shared by every module
│   ├── error-handler.ts          # unexpected errors become a logged 500
│   ├── make-app.ts               # Express app: logging, JSON parsing, /health, routers, 404
│   ├── make-request-logger.ts    # pino-http: request IDs, levels by status, redaction
│   └── not-found-handler.ts
├── lib/                          # language extensions with no domain meaning
│   ├── result.ts                 # Result, ok(), err()
│   └── typed-error.ts
└── tasks/                        # an example feature module
    ├── core/                     # inside the hexagon
    │   ├── application/          # use cases, one factory each
    │   ├── domain/               # entities, business rules and their errors
    │   ├── make-tasks.ts         # builds the module's core from its driven adapters
    │   └── ports/
    │       ├── driven/           # what the core needs: ForStoringTasks, ForGeneratingIds
    │       └── driving/          # what the core offers: ForManagingTasks
    └── adapters/                 # outside the hexagon
        ├── driven/persistence/   # in-memory task store
        └── driving/http/         # route handlers, router, response mapping
```

`main.ts` wires the pieces in order: it creates the driven adapters, builds each module's core with them, wraps each core in its driving adapters, and mounts the resulting routers on the HTTP host.

### Boundary rules

`eslint-plugin-boundaries` enforces the architecture on every lint run:

- `core/` may not import packages, Node.js built-ins or adapters.
- The domain imports nothing outside itself except `lib/`.
- Ports may import their module's domain, never its application code.
- Use cases may import their module's domain and ports.
- Driving adapters may import only their module's driving ports; driven adapters only their module's driven ports and domain.
- `http/` never imports a module, and modules never import `http/` or each other.
- Only `main.ts` and tests may wire everything together.
- Production code never imports test code.

Any file outside a recognised folder is a lint error, so new folders must be added to the rules in `eslint.config.js`.

## Conventions

- **Expected failures are values.** Use cases return `Result<T, E>` with a typed error; HTTP handlers map each error `type` to a status with an exhaustive `ts-pattern` match. Unexpected failures are thrown and handled centrally as a 500.
- **Each error is defined once,** where it arises: business-rule violations in the domain, use-case outcomes such as "not found" in the driving port.
- **Ports are named for their purpose,** as in `ForManagingTasks` and `ForStoringTasks`. Inputs are `…Command` or `…Query`; each operation's errors are a `…Error` union.
- **The HTTP response shape is owned by the adapter.** Handlers map the core's types through `toTaskResponse`, so internal changes don't leak into the API.
- **Factories that take dependencies are called `make…`** and take a `…Dependencies` object.
- **Files are named after their main export,** in kebab case. Test files are named after what they test.
- **Tests live next to the code they test.**

## Testing

| Test                                                 | Covers                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `core/domain/*.test.ts`                              | Business rules, including edge cases that are awkward to reach otherwise                                                 |
| `core/application/*.test.ts`                         | Each use case against the in-memory store                                                                                |
| `adapters/driving/http/make-<module>-router.test.ts` | The module over HTTP: on the real core with an in-memory store, then validation and error mapping with stubbed use cases |
| `adapters/driven/**/*.test.ts`                       | Each driven adapter's behaviour                                                                                          |
| `src/http/*.test.ts`                                 | The HTTP host: request logging, error handling and wiring                                                                |

Most behaviour is tested through the core with fakes for its driven ports, which keeps tests fast and independent of infrastructure.

## Extending the template

The repository includes [Claude Code](https://code.claude.com/docs/en/skills) skills for the recurring changes. Each one follows the conventions above, writes the tests, and finishes by running every check.

| Skill                 | Use it to                                                              |
| --------------------- | ---------------------------------------------------------------------- |
| `/add-module`         | Add a feature module, with its core, adapters, tests and wiring        |
| `/add-use-case`       | Add an operation to an existing module, from domain rule to HTTP route |
| `/add-driven-adapter` | Add another implementation of a driven port, such as a database store  |

Claude can also pick these up without the command, from requests such as "add an orders module". The skills live in `.claude/skills/`.

The boundary rules apply to new modules automatically. Modules must not import each other; when one needs another, decide how they communicate (for example, a small published interface) and allow exactly that in the rules.

## Notes

- **TypeScript is pinned to 6.0** because `typescript-eslint` does not support TypeScript 7 yet. Upgrade once it does.
- **This structure is deliberately complete.** For a small CRUD service it may be more than you need: merging the domain and application folders, or dropping the driving port in favour of calling use cases directly, are reasonable simplifications.

## License

[MIT](LICENSE)
