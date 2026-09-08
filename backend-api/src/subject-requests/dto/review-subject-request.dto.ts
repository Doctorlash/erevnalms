import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SubjectRequestReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewSubjectRequestDto {
  @IsEnum(SubjectRequestReviewAction)
  action!: SubjectRequestReviewAction;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;
}
