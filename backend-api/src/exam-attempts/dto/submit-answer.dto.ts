import { IsArray, IsString } from 'class-validator';

export class SubmitExamDto {
  @IsString()
  attemptId!: string;

  @IsArray()
  answers!: {
    questionId: string;
    selectedAnswer: string;
  }[];
}
