import { ToBoolean } from '@/decorators/transform.decorators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator';

export class BackfillExerciseEmbeddingsDto {
  @ApiPropertyOptional({ description: 'Batch size per request', default: 50 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  batchSize?: number;

  @ApiPropertyOptional({ description: 'Maximum rows to update' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Skip rows that already have embeddings',
    default: true,
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  skipExisting?: boolean;

  @ApiPropertyOptional({
    description: 'Dry run without writing embeddings',
    default: false,
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
