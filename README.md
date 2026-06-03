# NodeJS Template

A Node.js template for building RESTful APIs. Includes:

- Node and pnpm
- Express.js
- TypeScript
- Kysely query builder
- Vitest
- Docker
- PostgreSQL
- An example RESTful API
- Wide events based logging
- Otel tracing support
- Metrics support for Prometheus

The project structures follows the [Tao of Node](https://alexkondov.com/tao-of-node/), which I've found very useful during my career.

Logging follows the philosophy from [this](https://loggingsucks.com/) blog.

## Quickstart

You need to have

- [Docker](https://www.docker.com/)
- [pnpm](https://pnpm.io/) (v11)

installed to run this application.

```bash
# Assumes linux (native or WSL) or macOS environment
cp .env.example .env

# Start the database and app in detached mode
docker compose up -d

pnpm install
pnpm run migrate:latest
pnpm run seed run
```

Open http://localhost:3000/api/v1/event/list and you should see a list of events!

Run `docker compose down` when you are done.
Run `docker compose down -v` to remove volumes and clean up (removes data from the database!)

## Development

Run:

```bash
# Config Git for rebase fast-forward flow
git config pull.rebase true
git config merge.ff only

# Assumes linux (native or WSL) or macOS environment
cp .env.example .env

# Start the database in detached mode
docker compose up -d db

pnpm install
pnpm run migrate:latest
pnpm run seed run
pnpm run dev
```

You are now ready to make changes!

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making any changes.

Run `docker compose down` when you are done.
Run `docker compose down -v` to remove volumes and clean up (removes data from the database!)
