import { JwtPayloadType } from '@/api/auth/types/jwt-payload.type';
import { CurriculumMergeDto } from '@/api/curriculum/dto/merge-curriculum.dto';
import { CurriculumMergeService } from '@/api/curriculum/services/curriculum-merge.service';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('curriculum')
@Controller({ path: 'curriculum/merge', version: '1' })
export class CurriculumMergeController {
  constructor(
    private readonly curriculumMergeService: CurriculumMergeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Merge curriculum entities' })
  @ApiResponse({ status: 200, description: 'Merge result summary' })
  async merge(
    @Body() body: CurriculumMergeDto,
    @CurrentUser() user?: JwtPayloadType,
  ) {
    return this.curriculumMergeService.merge(
      body,
      user ? user.id : SYSTEM_USER_ID,
    );
  }
}
