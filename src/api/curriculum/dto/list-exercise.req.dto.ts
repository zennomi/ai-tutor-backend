import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { StringFieldOptional } from '@/decorators/field.decorators';

export class ListExerciseReqDto extends PageOptionsDto {
  @StringFieldOptional({ minLength: 1, maxLength: 2000 })
  readonly search?: string;
}
