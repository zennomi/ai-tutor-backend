import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { GenerateDocxDto } from './dto/generate-docx.dto';

@ApiTags('documents')
@Controller({
  path: 'documents',
  version: '1',
})
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('docx/generate-test')
  async generateTest(@Body() body: GenerateDocxDto) {
    return this.documentService.generateDocx(body);
  }
}
