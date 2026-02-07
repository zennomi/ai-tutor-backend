import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  BulkExerciseImportDto,
  BulkExerciseImportItemDto,
} from '../dto/bulk-exercise-import.dto';
import {
  CurriculumExerciseImportService,
  ImportResult,
} from '../services/curriculum-exercise-import.service';

@ApiTags('curriculum')
@Controller({
  path: 'curriculum/exercises',
  version: '1',
})
export class CurriculumExerciseImportController {
  constructor(
    private readonly curriculumExerciseImportService: CurriculumExerciseImportService,
  ) {}

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import exercises' })
  @ApiResponse({
    status: 200,
    description: 'Bulk import result',
    schema: {
      type: 'object',
      properties: {
        inserted: { type: 'number' },
        duplicateExercise: {
          type: 'array',
          items: { $ref: getSchemaPath(BulkExerciseImportItemDto) },
        },
      },
    },
  })
  async bulkImport(
    @Body() body: BulkExerciseImportDto,
    @CurrentUser() user?: JwtPayloadType,
  ): Promise<ImportResult> {
    return this.curriculumExerciseImportService.importExercises(
      body.items,
      user ? user.id : SYSTEM_USER_ID,
    );
  }
}
