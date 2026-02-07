import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export enum CurriculumMergeTable {
  Grade = 'grade',
  Unit = 'unit',
  Lesson = 'lesson',
  Format = 'format',
}

@ValidatorConstraint({ name: 'SourceDestinationDifferent', async: false })
class SourceDestinationDifferent implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const { sourceId, destinationId } = args.object as {
      sourceId?: string;
      destinationId?: string;
    };

    return !!sourceId && !!destinationId && sourceId !== destinationId;
  }

  defaultMessage(): string {
    return 'sourceId and destinationId must be different';
  }
}

export class CurriculumMergeDto {
  @ApiProperty({ enum: CurriculumMergeTable, enumName: 'CurriculumMergeTable' })
  @IsEnum(CurriculumMergeTable)
  table!: CurriculumMergeTable;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @Validate(SourceDestinationDifferent)
  destinationId!: string;
}
