import { ListExerciseReqDto } from '@/api/curriculum/dto/list-exercise.req.dto';
import { SearchExercisesResDto } from '@/api/curriculum/dto/search-exercises.res.dto';
import { CurriculumExerciseService } from '@/api/curriculum/services/curriculum-exercise.service';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { ApiPaginatedResponse } from '@/decorators/swagger.decorators';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('curriculum')
@Controller({ path: 'curriculum/exercises', version: '1' })
export class CurriculumExerciseController {
  constructor(
    private readonly curriculumExerciseService: CurriculumExerciseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List exercises with optional search' })
  @ApiPaginatedResponse({
    type: SearchExercisesResDto,
    paginationType: 'offset',
  })
  async list(
    @Query() query: ListExerciseReqDto,
  ): Promise<OffsetPaginatedDto<SearchExercisesResDto>> {
    return this.curriculumExerciseService.list(query);
  }
}
