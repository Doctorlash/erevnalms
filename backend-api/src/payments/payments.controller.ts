import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { InitializePaymentDto } from './dto/initialize-payment.dto';

import { PaymentsService } from './payments.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role?: string;
  };
}

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =========================================================
  // INITIALIZE PAYMENT
  // =========================================================

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  initialize(
    @Body() dto: InitializePaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.initialize(dto, req.user);
  }

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  verify(
    @Param('reference') reference: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.verify(reference, req.user);
  }

  // =========================================================
  // PAYSTACK WEBHOOK
  // =========================================================

  @Post('webhook')
  webhook(
    @Headers('x-paystack-signature')
    signature: string | undefined,
    @Req() req: RawBodyRequest,
    @Body() body: unknown,
  ) {
    if (!signature) {
      throw new UnauthorizedException(
        'Paystack webhook signature is required.',
      );
    }

    if (!req.rawBody) {
      throw new UnauthorizedException(
        'Webhook raw request body is unavailable.',
      );
    }

    return this.paymentsService.handleWebhook(signature, req.rawBody, body);
  }

  // =========================================================
  // MY PAYMENT HISTORY
  // =========================================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyPayments(
    @Req() req: AuthenticatedRequest,
    @Query('status')
    status?: string,
    @Query('cohortId')
    cohortId?: string,
    @Query('reference')
    reference?: string,
    @Query('page')
    page?: string,
    @Query('limit')
    limit?: string,
  ) {
    return this.paymentsService.findMyPayments(req.user, {
      status,
      cohortId,
      reference,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // =========================================================
  // ADMIN — ALL PAYMENT HISTORY
  // =========================================================

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllPayments(
    @Req() req: AuthenticatedRequest,
    @Query('status')
    status?: string,
    @Query('cohortId')
    cohortId?: string,
    @Query('reference')
    reference?: string,
    @Query('page')
    page?: string,
    @Query('limit')
    limit?: string,
  ) {
    return this.paymentsService.findAllPayments(req.user, {
      status,
      cohortId,
      reference,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // =========================================================
  // SINGLE PAYMENT
  // =========================================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOnePayment(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.paymentsService.findOnePayment(id, req.user);
  }
}
