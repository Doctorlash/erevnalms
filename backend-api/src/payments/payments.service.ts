/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import axios from 'axios';

import { PrismaService } from '../prisma/prisma.service';

import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private readonly planPrices = {
    FREE: 0,
    BASIC: 2500,
    PREMIUM: 5000,
    SCHOOL: 50000,
  };

  // =========================================================
  // INITIALIZE PAYMENT
  // =========================================================

  async initialize(dto: InitializePaymentDto) {
    const amount = this.planPrices[dto.plan];

    // FREE does not require Paystack payment
    if (dto.plan === 'FREE') {
      throw new BadRequestException('FREE plan does not require payment.');
    }

    // Validate subscription plan
    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid subscription plan.');
    }

    // Confirm that the user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: dto.email,
          amount: amount * 100,
          currency: 'NGN',

          callback_url: `${process.env.FRONTEND_URL}/dashboard/payment/callback`,

          metadata: {
            userId: dto.userId,
            plan: dto.plan,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error(
        'Paystack initialization failed:',
        error?.response?.data || error?.message,
      );

      throw new BadRequestException(
        error?.response?.data?.message || 'Unable to initialize payment.',
      );
    }
  }

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================

  async verify(reference: string) {
    try {
      // -----------------------------------------------------
      // VERIFY TRANSACTION WITH PAYSTACK
      // -----------------------------------------------------

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      const payment = response.data.data;

      // -----------------------------------------------------
      // PAYMENT STATUS
      // -----------------------------------------------------

      if (payment.status !== 'success') {
        throw new BadRequestException('Payment was not successful.');
      }

      // -----------------------------------------------------
      // PREVENT DUPLICATE SUBSCRIPTIONS
      // -----------------------------------------------------

      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          paymentReference: payment.reference,
        },
      });

      if (existingSubscription) {
        return {
          success: true,
          alreadyProcessed: true,
          message: 'Payment has already been verified.',
          subscription: existingSubscription,
        };
      }

      // -----------------------------------------------------
      // PAYMENT METADATA
      // -----------------------------------------------------

      const userId = payment.metadata?.userId;
      const plan = payment.metadata?.plan;

      if (!userId || !plan) {
        throw new BadRequestException(
          'Payment metadata is missing userId or plan.',
        );
      }

      // -----------------------------------------------------
      // VALIDATE PLAN
      // -----------------------------------------------------

      if (!(plan in this.planPrices)) {
        throw new BadRequestException('Invalid subscription plan.');
      }

      const expectedAmount = this.planPrices[plan];

      const paidAmount = Number(payment.amount) / 100;

      // -----------------------------------------------------
      // VALIDATE PAYMENT AMOUNT
      // -----------------------------------------------------

      if (paidAmount !== expectedAmount) {
        throw new BadRequestException(
          'Payment amount does not match the subscription plan.',
        );
      }

      // -----------------------------------------------------
      // VERIFY USER
      // -----------------------------------------------------

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException(
          'User associated with this payment was not found.',
        );
      }

      // -----------------------------------------------------
      // CREATE SUBSCRIPTION
      // -----------------------------------------------------

      const startDate = new Date();

      const endDate = new Date(startDate);

      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'ACTIVE',
          startDate,
          endDate,
          paymentReference: payment.reference,
        },
      });

      // -----------------------------------------------------
      // RETURN SUCCESS
      // -----------------------------------------------------

      return {
        success: true,
        alreadyProcessed: false,
        message: 'Payment verified successfully.',
        subscription,
      };
    } catch (error: any) {
      console.error(
        'Payment verification failed:',
        error?.response?.data || error?.message,
      );

      // Preserve our NestJS exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException(
        error?.response?.data?.message || 'Unable to verify payment.',
      );
    }
  }
}
