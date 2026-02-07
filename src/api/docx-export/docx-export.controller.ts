import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocxExportService } from './docx-export.service';
import { GenerateDocxDto } from './dto/generate-docx.dto';

@ApiTags('docx')
@Controller({
  path: 'docx',
  version: '1',
})
export class DocxExportController {
  constructor(private readonly docxExportService: DocxExportService) {}

  @Post('export')
  async generate(@Body() body: GenerateDocxDto) {
    return this.docxExportService.generateDocx(body);
  }
}
