import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // =========================================================
  // CREATE SUBSCRIPTION
  // =========================================================

  @Post()
  create(
    @Body()
    dto: CreateSubscriptionDto,
  ) {
    return this.service.create(dto);
  }

  // =========================================================
  // GET ALL SUBSCRIPTIONS
  // =========================================================

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // =========================================================
  // GET USER SUBSCRIPTIONS
  // =========================================================

  @Get('user/:userId')
  findByUser(
    @Param('userId')
    userId: string,
  ) {
    return this.service.findByUser(userId);
  }

  // =========================================================
  // INITIALIZE PAYMENT
  // =========================================================

  @Post(':id/pay')
  initializePayment(
    @Param('id')
    id: string,
  ) {
    return this.service.initializePayment(id);
  }

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================

  @Post('verify/:reference')
  verifyPayment(
    @Param('reference')
    reference: string,
  ) {
    return this.service.verifyPayment(reference);
  }

  // =========================================================
  // EXISTING ACTIVATION
  // =========================================================

  @Post(':id/activate')
  activate(
    @Param('id')
    id: string,
  ) {
    return this.service.activate(id);
  }
}
