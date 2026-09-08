import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { SubjectRequestReviewAction } from './review-subject-request.dto';

export class BulkReviewSubjectRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requestIds!: string[];

  @IsEnum(SubjectRequestReviewAction)
  action!: SubjectRequestReviewAction;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;
}
