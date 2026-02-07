import { EmbeddingService } from '@/common/services/embedding.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ExerciseEntity } from '../entities/exercise.entity';

export interface BackfillOptions {
  batchSize?: number;
  limit?: number;
  skipExisting?: boolean;
  dryRun?: boolean;
}

export interface BackfillResult {
  updated: number;
  skipped: number;
  batches: number;
  promptTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class CurriculumExerciseEmbeddingBackfillService {
  private readonly logger = new Logger(
    CurriculumExerciseEmbeddingBackfillService.name,
  );

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async backfill(options: BackfillOptions = {}): Promise<BackfillResult> {
    const batchSize =
      options.batchSize && options.batchSize > 0 ? options.batchSize : 50;
    const limit =
      options.limit && options.limit > 0 ? options.limit : undefined;
    const skipExisting = options.skipExisting !== false;
    const dryRun = options.dryRun === true;

    let offset = 0;
    let updated = 0;
    let skipped = 0;
    let batches = 0;
    let promptTokens = 0;
    let totalTokens = 0;

    while (true) {
      const qb = this.dataSource
        .getRepository(ExerciseEntity)
        .createQueryBuilder('exercise')
        .select([
          'exercise.id',
          'exercise.question',
          'exercise.questionEmbedding',
        ])
        .where('exercise.deleted_at IS NULL')
        .andWhere('exercise.question IS NOT NULL')
        .andWhere("TRIM(exercise.question) <> ''");

      if (skipExisting) {
        qb.andWhere('exercise.question_embedding IS NULL');
      }

      const remaining =
        limit !== undefined ? limit - (updated + skipped) : undefined;

      if (remaining !== undefined && remaining <= 0) {
        break;
      }

      qb.take(
        remaining !== undefined ? Math.min(batchSize, remaining) : batchSize,
      );
      qb.orderBy('exercise.created_at', 'ASC').skip(offset);

      const rows = await qb.getMany();

      if (!rows.length) {
        break;
      }

      batches += 1;

      for (const row of rows) {
        if (skipExisting && row.questionEmbedding) {
          skipped += 1;
          continue;
        }

        const embeddingResult = await this.embeddingService.embed(row.question);

        if (!embeddingResult) {
          skipped += 1;
          continue;
        }

        if (!dryRun) {
          await this.dataSource
            .createQueryBuilder()
            .update(ExerciseEntity)
            .set({ questionEmbedding: () => ':embedding::vector' })
            .where('id = :id', { id: row.id })
            .setParameters({ embedding: JSON.stringify(embeddingResult.embedding) })
            .execute();
        }

        if (embeddingResult.promptTokens) {
          promptTokens += embeddingResult.promptTokens;
        }

        if (embeddingResult.totalTokens) {
          totalTokens += embeddingResult.totalTokens;
        }

        updated += 1;
      }

      offset += rows.length;
    }

    this.logger.log(
      `Backfill finished: updated=${updated}, skipped=${skipped}, batches=${batches}, dryRun=${dryRun}, promptTokens=${promptTokens}, totalTokens=${totalTokens}`,
    );

    return { updated, skipped, batches, promptTokens, totalTokens };
  }
}
