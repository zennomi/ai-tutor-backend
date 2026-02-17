import { CurriculumTreeGradeResDto } from '@/api/curriculum/dto/curriculum-tree.res.dto';
import { ListCurriculumTreeReqDto } from '@/api/curriculum/dto/list-curriculum-tree.req.dto';
import { CurriculumTreeService } from '@/api/curriculum/services/curriculum-tree.service';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('curriculum')
@Controller({ path: 'curriculum/tree', version: '1' })
export class CurriculumTreeController {
  constructor(private readonly curriculumTreeService: CurriculumTreeService) {}

  @Get()
  @ApiOperation({ summary: 'List curriculum hierarchy as a tree' })
  @ApiOkResponse({ type: CurriculumTreeGradeResDto, isArray: true })
  async list(
    @Query() query: ListCurriculumTreeReqDto,
  ): Promise<CurriculumTreeGradeResDto[]> {
    return this.curriculumTreeService.list(query);
  }
}
