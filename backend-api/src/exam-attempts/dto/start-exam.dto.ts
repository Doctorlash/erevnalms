import { IsString } from 'class-validator';

export class StartExamDto {
  @IsString()
  examId!: string;

  @IsString()
  userId!: string;
}
