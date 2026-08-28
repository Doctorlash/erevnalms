import { IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsString()
  studentId!: string;

  @IsString()
  content!: string;
}
