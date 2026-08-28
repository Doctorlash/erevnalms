import { IsEnum, IsString } from 'class-validator';

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  SCHOOL = 'SCHOOL',
}

export class CreateSubscriptionDto {
  @IsString()
  userId!: string;

  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;
}
