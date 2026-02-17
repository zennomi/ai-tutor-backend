import type { BulkExerciseImportItemDto } from '@/api/curriculum/dto/bulk-exercise-import.dto';
import type { CurriculumMergeTable } from '@/api/curriculum/dto/merge-curriculum.dto';

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

export interface CurriculumMergeResult {
  table: CurriculumMergeTable;
  sourceId: string;
  destinationId: string;
  updatedCounts: {
    textbooks?: number;
    lessons?: number;
    exercises?: number;
    exerciseTypes?: number;
  };
  deleted: boolean;
}

export interface ImportResult {
  inserted: number;
  duplicateExercise: BulkExerciseImportItemDto[];
  newGrades: string[];
  newUnits: string[];
  newLessons: string[];
  newFormats: string[];
  newTypes: string[];
}
