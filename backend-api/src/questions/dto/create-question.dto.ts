import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum ExamType {
  WAEC = 'WAEC',
  JAMB = 'JAMB',
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  question!: string;

  @IsString()
  @MinLength(1)
  optionA!: string;

  @IsString()
  @MinLength(1)
  optionB!: string;

  @IsString()
  @MinLength(1)
  optionC!: string;

  @IsString()
  @MinLength(1)
  optionD!: string;

  @IsString()
  @MinLength(1)
  correctAnswer!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsEnum(ExamType)
  examType!: ExamType;

  @IsString()
  @MinLength(1)
  subjectId!: string;

  @IsOptional()
  @IsString()
  topicId?: string;
}
