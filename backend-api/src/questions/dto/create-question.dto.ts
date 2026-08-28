import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum ExamType {
  WAEC = 'WAEC',
  JAMB = 'JAMB',
  NECO = 'NECO',
}

export class CreateQuestionDto {
  @IsString()
  question!: string;

  @IsString()
  optionA!: string;

  @IsString()
  optionB!: string;

  @IsString()
  optionC!: string;

  @IsString()
  optionD!: string;

  @IsString()
  correctAnswer!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsEnum(ExamType)
  examType!: ExamType;

  @IsString()
  subjectId!: string;

  @IsOptional()
  @IsString()
  topicId?: string;
}
