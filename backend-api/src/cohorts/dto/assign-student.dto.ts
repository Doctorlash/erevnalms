import { IsNotEmpty, IsString } from 'class-validator';

export class AssignStudentDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
