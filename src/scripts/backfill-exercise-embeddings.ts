import 'reflect-metadata';

import { CurriculumExerciseEmbeddingBackfillService } from '@/api/curriculum/services/curriculum-exercise-embedding-backfill.service';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

// pnpm embeddings:backfill
async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const backfillService = appContext.get(
    CurriculumExerciseEmbeddingBackfillService,
  );

  const batchSize = process.env.BATCH_SIZE
    ? parseInt(process.env.BATCH_SIZE, 10)
    : undefined;
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : undefined;
  const skipExisting = process.env.SKIP_EXISTING
    ? process.env.SKIP_EXISTING.toLowerCase() !== 'false'
    : true;
  const dryRun = process.env.DRY_RUN === 'true';

  const result = await backfillService.backfill({
    batchSize,
    limit,
    skipExisting,
    dryRun,
  });

  Logger.log(
    `Backfill result: updated=${result.updated}, skipped=${result.skipped}, batches=${result.batches}, dryRun=${dryRun}, promptTokens=${result.promptTokens ?? 0}, totalTokens=${result.totalTokens ?? 0}`,
  );

  await appContext.close();
}

bootstrap().catch((error) => {
  Logger.error('Backfill failed', error);
  process.exit(1);
});
