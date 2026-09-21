/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import axios from 'axios';

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import {
  PaymentStatus,
  Prisma,
  StudentCohortStatus,
  SubscriptionStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { InitializePaymentDto } from './dto/initialize-payment.dto';

interface AuthenticatedUser {
  id: string;
  role?: string;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at?: string | null;
    channel?: string | null;
    gateway_response?: string | null;
    metadata?: unknown;
  };
}

interface PaystackWebhookEvent {
  event?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    channel?: string | null;
    gateway_response?: string | null;
    metadata?: unknown;
  };
}

interface PaymentHistoryQuery {
  status?: string;
  cohortId?: string;
  reference?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly paystackUrl = 'https://api.paystack.co';

  // =========================================================
  // INITIALIZE COHORT PAYMENT
  // =========================================================

  async initialize(
    dto: InitializePaymentDto,
    authenticatedUser: AuthenticatedUser,
  ) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authenticated student is required.');
    }

    if (authenticatedUser.role && authenticatedUser.role !== 'STUDENT') {
      throw new UnauthorizedException(
        'Only students can initialize cohort payments.',
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      throw new BadGatewayException(
        'Payment service is not properly configured.',
      );
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new BadGatewayException(
        'Payment callback configuration is missing.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: authenticatedUser.id,
      },
    });

    if (!user) {
      throw new NotFoundException('Student account not found.');
    }

    if (user.role !== 'STUDENT') {
      throw new UnauthorizedException(
        'Only student accounts can make cohort payments.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your student account is not active.');
    }

    const cohort = await this.prisma.cohort.findUnique({
      where: {
        id: dto.cohortId,
      },
    });

    if (!cohort) {
      throw new NotFoundException('Cohort not found.');
    }

    if (cohort.status === 'CANCELLED') {
      throw new BadRequestException(
        'This cohort has been cancelled and cannot accept payments.',
      );
    }

    const now = new Date();

    if (now >= cohort.endDate) {
      throw new BadRequestException('This cohort has already ended.');
    }

    if (cohort.fee <= 0) {
      throw new BadRequestException(
        'This cohort does not have a valid payment fee configured.',
      );
    }

    const studentProgramme = await this.prisma.studentProgramme.findUnique({
      where: {
        userId_programme: {
          userId: user.id,
          programme: cohort.programme,
        },
      },
    });

    if (!studentProgramme) {
      throw new BadRequestException(
        `You are not registered for the ${cohort.programme} programme.`,
      );
    }

    const studentCohort = await this.prisma.studentCohort.findUnique({
      where: {
        userId_cohortId: {
          userId: user.id,
          cohortId: cohort.id,
        },
      },
    });

    if (!studentCohort) {
      throw new BadRequestException(
        'You must be assigned to this cohort before making payment.',
      );
    }

    if (studentCohort.status !== StudentCohortStatus.ACTIVE) {
      throw new BadRequestException(
        `Your membership in this cohort is ${studentCohort.status.toLowerCase()}.`,
      );
    }

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        studentCohortId: studentCohort.id,
      },
    });

    if (
      existingSubscription &&
      existingSubscription.status === SubscriptionStatus.ACTIVE &&
      existingSubscription.endDate &&
      existingSubscription.endDate > now
    ) {
      throw new ConflictException(
        'You already have an active subscription for this cohort.',
      );
    }

    if (
      existingSubscription &&
      existingSubscription.status !== SubscriptionStatus.PENDING &&
      existingSubscription.status !== SubscriptionStatus.EXPIRED
    ) {
      throw new ConflictException(
        'A subscription already exists for this cohort and cannot be replaced.',
      );
    }

    if (existingSubscription) {
      const pendingPayment = await this.prisma.payment.findFirst({
        where: {
          subscriptionId: existingSubscription.id,
          status: PaymentStatus.PENDING,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (pendingPayment) {
        throw new ConflictException(
          'A payment for this cohort is already being processed. Please complete that payment or wait for it to finish before starting another payment.',
        );
      }
    }

    const paymentSetup = await this.prisma.$transaction(
      async (tx) => {
        const lockedSubscription = await tx.subscription.findUnique({
          where: {
            studentCohortId: studentCohort.id,
          },
        });

        if (lockedSubscription) {
          const pendingPayment = await tx.payment.findFirst({
            where: {
              subscriptionId: lockedSubscription.id,
              status: PaymentStatus.PENDING,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          if (pendingPayment) {
            throw new ConflictException(
              'A payment for this cohort is already being processed. Please complete that payment or wait for it to finish before starting another payment.',
            );
          }
        }

        if (
          lockedSubscription &&
          lockedSubscription.status === SubscriptionStatus.ACTIVE &&
          lockedSubscription.endDate &&
          lockedSubscription.endDate > new Date()
        ) {
          throw new ConflictException(
            'You already have an active subscription for this cohort.',
          );
        }

        if (
          lockedSubscription &&
          lockedSubscription.status !== SubscriptionStatus.PENDING &&
          lockedSubscription.status !== SubscriptionStatus.EXPIRED
        ) {
          throw new ConflictException(
            'A subscription already exists for this cohort and cannot be replaced.',
          );
        }

        let subscription;

        if (!lockedSubscription) {
          subscription = await tx.subscription.create({
            data: {
              userId: user.id,
              plan: null,
              billingType: 'COHORT',
              status: SubscriptionStatus.PENDING,
              startDate: cohort.startDate,
              endDate: cohort.endDate,
              cohortId: cohort.id,
              studentCohortId: studentCohort.id,
              amount: cohort.fee,
              currency: 'NGN',
            },
          });
        } else {
          subscription = await tx.subscription.update({
            where: {
              id: lockedSubscription.id,
            },
            data: {
              userId: user.id,
              plan: null,
              billingType: 'COHORT',
              status: SubscriptionStatus.PENDING,
              startDate: cohort.startDate,
              endDate: cohort.endDate,
              cohortId: cohort.id,
              studentCohortId: studentCohort.id,
              amount: cohort.fee,
              currency: 'NGN',
              paymentReference: null,
            },
          });
        }

        const paymentReference = this.generatePaymentReference();

        const payment = await tx.payment.create({
          data: {
            userId: user.id,
            cohortId: cohort.id,
            studentCohortId: studentCohort.id,
            subscriptionId: subscription.id,
            amount: cohort.fee,
            currency: 'NGN',
            status: PaymentStatus.PENDING,
            paymentReference,
            provider: 'PAYSTACK',
          },
        });

        return {
          payment,
          subscription,
          paymentReference,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    const { payment, subscription, paymentReference } = paymentSetup;

    try {
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackUrl}/transaction/initialize`,
        {
          email: user.email,

          amount: cohort.fee * 100,

          currency: 'NGN',

          reference: paymentReference,

          callback_url: `${frontendUrl}/dashboard/payment/callback`,

          metadata: {
            paymentId: payment.id,
            subscriptionId: subscription.id,
            cohortId: cohort.id,
            studentCohortId: studentCohort.id,
            userId: user.id,
            programme: cohort.programme,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      if (!response.data?.status || !response.data?.data) {
        await this.markPaymentFailed(
          payment.id,
          'Paystack did not return a valid authorization response.',
        );

        throw new BadGatewayException(
          'Unable to initialize payment with Paystack.',
        );
      }

      if (response.data.data.reference !== paymentReference) {
        await this.markPaymentFailed(
          payment.id,
          'Paystack returned a reference different from the Erevna payment reference.',
        );

        throw new BadGatewayException(
          'Payment initialization reference mismatch.',
        );
      }

      return {
        success: true,
        paymentId: payment.id,
        subscriptionId: subscription.id,
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        amount: cohort.fee,
        currency: 'NGN',
        cohort: {
          id: cohort.id,
          name: cohort.name,
          programme: cohort.programme,
          startDate: cohort.startDate,
          endDate: cohort.endDate,
        },
      };
    } catch (error: unknown) {
      console.error(
        'Paystack initialization failed:',
        this.extractErrorMessage(error),
      );

      await this.markPaymentFailed(payment.id, this.extractErrorMessage(error));

      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(
        'Unable to initialize payment with Paystack. Please try again.',
      );
    }
  }

  // =========================================================
  // VERIFY PAYMENT FROM BROWSER CALLBACK
  // =========================================================

  async verify(reference: string, authenticatedUser: AuthenticatedUser) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authenticated student is required.');
    }

    if (authenticatedUser.role && authenticatedUser.role !== 'STUDENT') {
      throw new UnauthorizedException(
        'Only students can verify cohort payments.',
      );
    }

    if (!reference?.trim()) {
      throw new BadRequestException('Payment reference is required.');
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      throw new BadGatewayException(
        'Payment service is not properly configured.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        paymentReference: reference,
      },
      include: {
        subscription: true,
        cohort: true,
        studentCohort: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    if (payment.userId !== authenticatedUser.id) {
      throw new UnauthorizedException(
        'You are not authorized to verify this payment.',
      );
    }

    if (
      payment.status === PaymentStatus.PAID &&
      payment.subscription?.status === SubscriptionStatus.ACTIVE
    ) {
      return this.getSuccessfulPaymentResult(payment.id);
    }

    let paystackResponse: PaystackVerifyResponse;

    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${this.paystackUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      paystackResponse = response.data;
    } catch (error: unknown) {
      console.error(
        'Paystack verification failed:',
        this.extractErrorMessage(error),
      );

      throw new BadGatewayException('Unable to verify payment with Paystack.');
    }

    if (!paystackResponse?.status || !paystackResponse.data) {
      throw new BadRequestException(
        paystackResponse?.message ||
          'Paystack could not verify this transaction.',
      );
    }

    const transaction = paystackResponse.data;

    if (transaction.reference !== reference) {
      throw new BadRequestException('Payment reference mismatch.');
    }

    if (transaction.status !== 'success') {
      await this.updatePaymentFromUnsuccessfulVerification(
        payment.id,
        transaction.status,
      );

      return {
        success: false,
        paid: false,
        reference,
        status: transaction.status,
        message: 'Payment has not been successfully completed.',
      };
    }

    const expectedAmount = payment.amount * 100;

    if (transaction.amount !== expectedAmount) {
      await this.markPaymentFailed(
        payment.id,
        `Amount mismatch. Expected ${expectedAmount}, received ${transaction.amount}.`,
      );

      throw new BadRequestException(
        'Payment amount does not match the required cohort fee.',
      );
    }

    if (
      transaction.currency &&
      transaction.currency.toUpperCase() !== payment.currency.toUpperCase()
    ) {
      await this.markPaymentFailed(
        payment.id,
        `Currency mismatch. Expected ${payment.currency}, received ${transaction.currency}.`,
      );

      throw new BadRequestException(
        'Payment currency does not match the required currency.',
      );
    }

    return this.fulfillSuccessfulPayment(payment.id, transaction);
  }

  // =========================================================
  // PAYSTACK WEBHOOK
  // =========================================================

  async handleWebhook(signature: string, rawBody: Buffer, body: unknown) {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      throw new BadGatewayException(
        'Payment service is not properly configured.',
      );
    }

    if (!signature?.trim()) {
      throw new UnauthorizedException(
        'Paystack webhook signature is required.',
      );
    }

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new UnauthorizedException(
        'Webhook raw request body is unavailable.',
      );
    }

    const expectedSignature = createHmac('sha512', paystackSecretKey)
      .update(rawBody)
      .digest('hex');

    const receivedSignature = signature.trim();

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new UnauthorizedException('Invalid Paystack webhook signature.');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid Paystack webhook payload.');
    }

    const event = body as PaystackWebhookEvent;

    if (event.event !== 'charge.success') {
      return {
        success: true,
        processed: false,
        event: event.event || null,
      };
    }

    const transaction = event.data;

    if (!transaction) {
      throw new BadRequestException(
        'Paystack webhook transaction data is missing.',
      );
    }

    if (
      transaction.id === undefined ||
      !transaction.reference ||
      transaction.amount === undefined
    ) {
      throw new BadRequestException(
        'Paystack webhook transaction data is incomplete.',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        paymentReference: transaction.reference,
      },
    });

    if (!payment) {
      return {
        success: true,
        processed: false,
        ignored: true,
        reason: 'No matching Erevna payment record.',
        reference: transaction.reference,
      };
    }

    if (payment.provider.toUpperCase() !== 'PAYSTACK') {
      throw new BadRequestException('Payment provider mismatch.');
    }

    if (payment.status === PaymentStatus.PAID) {
      return {
        success: true,
        processed: false,
        alreadyProcessed: true,
        reference: payment.paymentReference,
        paymentId: payment.id,
      };
    }

    if (transaction.reference !== payment.paymentReference) {
      throw new BadRequestException('Payment reference mismatch.');
    }

    if (transaction.status !== 'success') {
      return {
        success: true,
        processed: false,
        paid: false,
        reference: transaction.reference,
        status: transaction.status || null,
      };
    }

    const expectedAmount = payment.amount * 100;

    if (transaction.amount !== expectedAmount) {
      await this.markPaymentFailed(
        payment.id,
        `Webhook amount mismatch. Expected ${expectedAmount}, received ${transaction.amount}.`,
      );

      throw new BadRequestException(
        'Payment amount does not match the required cohort fee.',
      );
    }

    if (
      transaction.currency &&
      transaction.currency.toUpperCase() !== payment.currency.toUpperCase()
    ) {
      await this.markPaymentFailed(
        payment.id,
        `Webhook currency mismatch. Expected ${payment.currency}, received ${transaction.currency}.`,
      );

      throw new BadRequestException(
        'Payment currency does not match the required currency.',
      );
    }

    return this.fulfillSuccessfulPayment(payment.id, {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency || payment.currency,
      paid_at: transaction.paid_at,
      channel: transaction.channel,
      gateway_response: transaction.gateway_response,
      metadata: transaction.metadata,
    });
  }

  // =========================================================
  // STUDENT PAYMENT HISTORY
  // =========================================================

  async findMyPayments(
    authenticatedUser: AuthenticatedUser,
    query: PaymentHistoryQuery = {},
  ) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const page = this.normalizePage(query.page);

    const limit = this.normalizeLimit(query.limit);

    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      userId: authenticatedUser.id,
    };

    if (query.status) {
      if (!this.isValidPaymentStatus(query.status)) {
        throw new BadRequestException('Invalid payment status.');
      }

      where.status = query.status as PaymentStatus;
    }

    if (query.cohortId) {
      where.cohortId = query.cohortId;
    }

    if (query.reference?.trim()) {
      where.paymentReference = {
        contains: query.reference.trim(),
        mode: 'insensitive',
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentReference: true,
          paymentMethod: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          provider: true,
          providerTransactionId: true,

          cohort: {
            select: {
              id: true,
              name: true,
              programme: true,
              startDate: true,
              endDate: true,
              fee: true,
              status: true,
            },
          },

          subscription: {
            select: {
              id: true,
              status: true,
              billingType: true,
              startDate: true,
              endDate: true,
              amount: true,
              currency: true,
            },
          },
        },
      }),

      this.prisma.payment.count({
        where,
      }),
    ]);

    return {
      success: true,

      data: payments,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================
  // ADMIN PAYMENT HISTORY
  // =========================================================

  async findAllPayments(
    authenticatedUser: AuthenticatedUser,
    query: PaymentHistoryQuery = {},
  ) {
    this.requireAdmin(authenticatedUser);

    const page = this.normalizePage(query.page);

    const limit = this.normalizeLimit(query.limit);

    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      if (!this.isValidPaymentStatus(query.status)) {
        throw new BadRequestException('Invalid payment status.');
      }

      where.status = query.status as PaymentStatus;
    }

    if (query.cohortId) {
      where.cohortId = query.cohortId;
    }

    if (query.reference?.trim()) {
      where.paymentReference = {
        contains: query.reference.trim(),
        mode: 'insensitive',
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          amount: true,
          currency: true,
          status: true,
          paymentReference: true,
          paymentMethod: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          provider: true,
          providerTransactionId: true,
          gatewayResponse: true,

          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          cohort: {
            select: {
              id: true,
              name: true,
              programme: true,
              startDate: true,
              endDate: true,
              fee: true,
              status: true,
            },
          },

          studentCohort: {
            select: {
              id: true,
              status: true,
              joinedAt: true,
              completedAt: true,
            },
          },

          subscription: {
            select: {
              id: true,
              status: true,
              billingType: true,
              startDate: true,
              endDate: true,
              amount: true,
              currency: true,
            },
          },
        },
      }),

      this.prisma.payment.count({
        where,
      }),
    ]);

    return {
      success: true,

      data: payments,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =========================================================
  // SINGLE PAYMENT
  // =========================================================

  async findOnePayment(
    paymentId: string,
    authenticatedUser: AuthenticatedUser,
  ) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        paymentReference: true,
        paymentMethod: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        provider: true,
        providerTransactionId: true,
        gatewayResponse: true,

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        cohort: {
          select: {
            id: true,
            name: true,
            programme: true,
            description: true,
            startDate: true,
            endDate: true,
            fee: true,
            status: true,
          },
        },

        studentCohort: {
          select: {
            id: true,
            status: true,
            joinedAt: true,
            completedAt: true,
          },
        },

        subscription: {
          select: {
            id: true,
            status: true,
            billingType: true,
            startDate: true,
            endDate: true,
            amount: true,
            currency: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    const isAdmin = authenticatedUser.role === 'ADMIN';

    if (!isAdmin && payment.userId !== authenticatedUser.id) {
      throw new UnauthorizedException(
        'You are not authorized to view this payment.',
      );
    }

    // -------------------------------------------------------
    // STUDENTS MUST NOT RECEIVE RAW GATEWAY RESPONSE
    // -------------------------------------------------------

    if (!isAdmin) {
      const {
        gatewayResponse: _gatewayResponse,
        user: paymentUser,
        ...safePayment
      } = payment;

      return {
        success: true,
        data: {
          ...safePayment,
          user: {
            id: paymentUser.id,
            firstName: paymentUser.firstName,
            lastName: paymentUser.lastName,
          },
        },
      };
    }

    return {
      success: true,
      data: payment,
    };
  }

  // =========================================================
  // FULFILL SUCCESSFUL PAYMENT
  // =========================================================

  private async fulfillSuccessfulPayment(
    paymentId: string,
    transaction: NonNullable<PaystackVerifyResponse['data']>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: {
            id: paymentId,
          },
          include: {
            subscription: true,
            cohort: true,
            studentCohort: true,
          },
        });

        if (!payment) {
          throw new NotFoundException('Payment record not found.');
        }

        if (
          payment.status === PaymentStatus.PAID &&
          payment.subscription?.status === SubscriptionStatus.ACTIVE
        ) {
          return {
            success: true,
            paid: true,
            alreadyProcessed: true,
            reference: payment.paymentReference,
            paymentId: payment.id,
            subscriptionId: payment.subscription.id,
          };
        }

        if (!payment.cohort) {
          throw new BadRequestException(
            'Payment is not associated with a cohort.',
          );
        }

        if (!payment.studentCohort) {
          throw new BadRequestException(
            'Payment is not associated with a student cohort membership.',
          );
        }

        if (!payment.subscription) {
          throw new BadRequestException(
            'Payment is not associated with a subscription.',
          );
        }

        if (payment.subscription.userId !== payment.userId) {
          throw new BadRequestException(
            'Payment and subscription user do not match.',
          );
        }

        if (payment.subscription.cohortId !== payment.cohort.id) {
          throw new BadRequestException(
            'Subscription and cohort do not match.',
          );
        }

        if (payment.subscription.studentCohortId !== payment.studentCohort.id) {
          throw new BadRequestException(
            'Subscription and student cohort do not match.',
          );
        }

        if (payment.studentCohort.userId !== payment.userId) {
          throw new BadRequestException(
            'Student cohort membership does not belong to the payment owner.',
          );
        }

        if (payment.studentCohort.cohortId !== payment.cohort.id) {
          throw new BadRequestException(
            'Student cohort membership does not belong to the payment cohort.',
          );
        }

        const now = new Date();

        if (payment.cohort.status === 'CANCELLED') {
          throw new BadRequestException(
            'The cohort has been cancelled. Payment cannot be fulfilled.',
          );
        }

        if (now >= payment.cohort.endDate) {
          throw new BadRequestException(
            'The cohort has already ended. Payment cannot be fulfilled.',
          );
        }

        if (payment.studentCohort.status !== StudentCohortStatus.ACTIVE) {
          throw new BadRequestException(
            'The student is no longer active in this cohort.',
          );
        }

        if (transaction.reference !== payment.paymentReference) {
          throw new BadRequestException(
            'Payment reference mismatch during fulfillment.',
          );
        }

        if (transaction.amount !== payment.amount * 100) {
          throw new BadRequestException(
            'Payment amount mismatch during fulfillment.',
          );
        }

        if (
          transaction.currency &&
          transaction.currency.toUpperCase() !== payment.currency.toUpperCase()
        ) {
          throw new BadRequestException(
            'Payment currency mismatch during fulfillment.',
          );
        }

        const paidAt = transaction.paid_at
          ? new Date(transaction.paid_at)
          : now;

        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.PAID,

            paidAt,

            providerTransactionId: String(transaction.id),

            paymentMethod: transaction.channel || undefined,

            gatewayResponse: JSON.stringify(transaction),
          },
        });

        const subscription = await tx.subscription.update({
          where: {
            id: payment.subscription.id,
          },
          data: {
            status: SubscriptionStatus.ACTIVE,

            plan: null,

            billingType: 'COHORT',

            startDate: payment.cohort.startDate,

            endDate: payment.cohort.endDate,

            cohortId: payment.cohort.id,

            studentCohortId: payment.studentCohort.id,

            amount: payment.amount,

            currency: payment.currency,

            paymentReference: payment.paymentReference,
          },
        });

        const approvedRequests = await tx.subjectRequest.findMany({
          where: {
            userId: payment.userId,

            programme: payment.cohort.programme,

            status: 'APPROVED',
          },
          select: {
            subjectId: true,
          },
        });

        const enrollmentIds: string[] = [];

        for (const request of approvedRequests) {
          const existingEnrollment = await tx.enrollment.findUnique({
            where: {
              userId_subjectId: {
                userId: payment.userId,
                subjectId: request.subjectId,
              },
            },
          });

          if (existingEnrollment) {
            const updatedEnrollment = await tx.enrollment.update({
              where: {
                id: existingEnrollment.id,
              },
              data: {
                type: 'PAID',

                cohortId: payment.cohort.id,

                studentCohortId: payment.studentCohort.id,

                expiresAt: payment.cohort.endDate,

                programme: payment.cohort.programme,
              },
            });

            enrollmentIds.push(updatedEnrollment.id);

            continue;
          }

          const enrollment = await tx.enrollment.create({
            data: {
              userId: payment.userId,

              subjectId: request.subjectId,

              programme: payment.cohort.programme,

              type: 'PAID',

              enrolledAt: now,

              expiresAt: payment.cohort.endDate,

              cohortId: payment.cohort.id,

              studentCohortId: payment.studentCohort.id,
            },
          });

          enrollmentIds.push(enrollment.id);
        }

        return {
          success: true,

          paid: true,

          alreadyProcessed: false,

          reference: payment.paymentReference,

          paymentId: payment.id,

          subscriptionId: subscription.id,

          cohortId: payment.cohort.id,

          studentCohortId: payment.studentCohort.id,

          enrolledSubjects: enrollmentIds.length,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  // =========================================================
  // SUCCESSFUL PAYMENT RESULT
  // =========================================================

  private async getSuccessfulPaymentResult(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        subscription: true,
        cohort: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found.');
    }

    return {
      success: true,

      paid: true,

      alreadyProcessed: true,

      reference: payment.paymentReference,

      paymentId: payment.id,

      subscriptionId: payment.subscription?.id || null,

      cohortId: payment.cohortId,

      amount: payment.amount,

      currency: payment.currency,
    };
  }

  // =========================================================
  // MARK PAYMENT FAILED
  // =========================================================

  private async markPaymentFailed(paymentId: string, reason?: string) {
    try {
      await this.prisma.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.FAILED,

          gatewayResponse: reason
            ? JSON.stringify({
                error: reason,
              })
            : undefined,
        },
      });
    } catch (error: unknown) {
      console.error(
        'Unable to mark payment as failed:',
        this.extractErrorMessage(error),
      );
    }
  }

  // =========================================================
  // HANDLE UNSUCCESSFUL PAYSTACK VERIFICATION
  // =========================================================

  private async updatePaymentFromUnsuccessfulVerification(
    paymentId: string,
    providerStatus: string,
  ) {
    let status: PaymentStatus = PaymentStatus.PENDING;

    if (['failed', 'abandoned', 'reversed'].includes(providerStatus)) {
      status = PaymentStatus.FAILED;
    }

    await this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status,

        gatewayResponse: JSON.stringify({
          providerStatus,
        }),
      },
    });
  }

  // =========================================================
  // ADMIN AUTHORIZATION
  // =========================================================

  private requireAdmin(authenticatedUser: AuthenticatedUser) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authentication is required.');
    }

    if (authenticatedUser.role !== 'ADMIN') {
      throw new UnauthorizedException(
        'Only administrators can access all payment records.',
      );
    }
  }

  // =========================================================
  // PAYMENT STATUS VALIDATION
  // =========================================================

  private isValidPaymentStatus(status: string): boolean {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }

  // =========================================================
  // PAGINATION
  // =========================================================

  private normalizePage(page?: number): number {
    if (page === undefined || !Number.isFinite(page) || page < 1) {
      return 1;
    }

    return Math.floor(page);
  }

  private normalizeLimit(limit?: number): number {
    if (limit === undefined || !Number.isFinite(limit)) {
      return 20;
    }

    return Math.min(Math.max(Math.floor(limit), 1), 100);
  }

  // =========================================================
  // PAYMENT REFERENCE
  // =========================================================

  private generatePaymentReference(): string {
    const shortId = randomUUID().replace(/-/g, '').slice(0, 20);

    return `EREVNA-${Date.now()}-${shortId}`;
  }

  // =========================================================
  // ERROR MESSAGE
  // =========================================================

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return (
        error.response?.data?.message ||
        error.message ||
        'Paystack request failed.'
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown payment error.';
  }
}
