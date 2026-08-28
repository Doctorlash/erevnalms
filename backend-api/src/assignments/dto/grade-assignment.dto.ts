import { IsInt, IsString } from 'class-validator';

export class GradeAssignmentDto {
  @IsInt()
  score!: number;

  @IsString()
  feedback!: string;
}
