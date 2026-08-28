import { IsString } from 'class-validator';

export class AddQuestionDto {
  @IsString()
  questionId!: string;
}
