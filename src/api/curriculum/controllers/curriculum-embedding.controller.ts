import { Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BackfillExerciseEmbeddingsDto } from '../dto/backfill-exercise-embeddings.dto';
import { CurriculumExerciseEmbeddingBackfillService } from '../services/curriculum-exercise-embedding-backfill.service';

@ApiTags('curriculum')
@Controller({ path: 'curriculum/embeddings', version: '1' })
export class CurriculumEmbeddingController {
  constructor(
    private readonly backfillService: CurriculumExerciseEmbeddingBackfillService,
  ) {}

  @Post('backfill-exercises')
  @ApiOperation({ summary: 'Backfill exercise embeddings (admin/ops)' })
  async backfillExercises(
    @Query() query: BackfillExerciseEmbeddingsDto,
  ): Promise<{
    updated: number;
    skipped: number;
    batches: number;
    promptTokens?: number;
    totalTokens?: number;
  }> {
    return this.backfillService.backfill({
      batchSize: query.batchSize,
      limit: query.limit,
      skipExisting: query.skipExisting,
      dryRun: query.dryRun,
    });
  }
}
