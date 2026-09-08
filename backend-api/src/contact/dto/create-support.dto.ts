import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSupportDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
