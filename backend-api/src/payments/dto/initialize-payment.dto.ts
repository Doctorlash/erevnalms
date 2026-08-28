import { IsEmail, IsEnum, IsString } from 'class-validator';

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  SCHOOL = 'SCHOOL',
}

export class InitializePaymentDto {
  @IsString()
  userId!: string;

  @IsEmail()
  email!: string;

  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}
