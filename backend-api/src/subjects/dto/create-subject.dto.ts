import { IsString, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
