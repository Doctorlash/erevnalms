import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PaymentsService } from './payments.service';

import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  initialize(
    @Body()
    dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initialize(dto);
  }

  @Get('verify/:reference')
  verify(
    @Param('reference')
    reference: string,
  ) {
    return this.paymentsService.verify(reference);
  }
}
