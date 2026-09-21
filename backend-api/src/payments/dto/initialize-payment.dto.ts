import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cohortId!: string;
}
