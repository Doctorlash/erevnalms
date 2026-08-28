/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

import {
  InitializePaymentDto,
  SubscriptionPlan,
} from '../payments/dto/initialize-payment.dto';

import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  // =========================================================
  // CREATE SUBSCRIPTION
  // =========================================================

  async create(dto: CreateSubscriptionDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.subscription.create({
      data: {
        userId: dto.userId,
        plan: dto.plan,
        status: 'PENDING',
      },
    });
  }

  // =========================================================
  // FIND ALL SUBSCRIPTIONS
  // =========================================================

  async findAll() {
    return this.prisma.subscription.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // FIND USER SUBSCRIPTIONS
  // =========================================================

  async findByUser(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
      },
    });

    const now = new Date();

    for (const subscription of subscriptions) {
      if (
        subscription.status === 'ACTIVE' &&
        subscription.endDate &&
        subscription.endDate <= now
      ) {
        await this.prisma.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: 'EXPIRED',
          },
        });

        subscription.status = 'EXPIRED';
      }
    }

    return subscriptions;
  }

  // =========================================================
  // INITIALIZE PAYMENT
  // =========================================================

  async initializePayment(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        user: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const dto: InitializePaymentDto = {
      userId: subscription.userId,
      email: subscription.user.email,
      plan: subscription.plan as SubscriptionPlan,
    };

    return this.paymentsService.initialize(dto);
  }

  // =========================================================
  // VERIFY PAYMENT
  // =========================================================

  async verifyPayment(reference: string) {
    return this.paymentsService.verify(reference);
  }

  // =========================================================
  // ACTIVATE SUBSCRIPTION
  // =========================================================

  async activate(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();

    const endDate = new Date(now);

    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.subscription.update({
      where: {
        id,
      },
      data: {
        status: 'ACTIVE',
        startDate: now,
        endDate,
      },
    });
  }
}
