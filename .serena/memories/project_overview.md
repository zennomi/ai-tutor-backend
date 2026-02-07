# Project Overview
- NestJS backend boilerplate (TypeScript), modular monolith architecture.
- Tech: NestJS 10, TypeORM (PostgreSQL), BullMQ, Redis cache, Mailer, Swagger, JWT auth.
- Package manager: pnpm.
- Lint/format: ESLint + Prettier (2-space, single quotes, semicolons).
- Logging: nestjs-pino. Security: Helmet, validation via class-validator.
- Structure: src/api (feature modules/controllers/services/DTOs/entities), src/background (jobs/queues), src/common (shared DTOs/types), src/config (typed configs), src/constants, src/database (config, entities, migrations, seeds), src/utils (helpers), src/libs, src/mail, src/shared, src/decorators/guards/filters/exceptions.