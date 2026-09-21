import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { SubscriptionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedUser {
  id: string;
  role?: string;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // FIND ALL SUBSCRIPTIONS
  // ADMIN USE
  // =========================================================

  async findAll(authenticatedUser: AuthenticatedUser) {
    this.requireAdmin(authenticatedUser);

    const subscriptions = await this.prisma.subscription.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        cohort: true,

        studentCohort: {
          include: {
            cohort: true,
          },
        },

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return this.expireSubscriptions(subscriptions);
  }

  // =========================================================
  // FIND CURRENT USER SUBSCRIPTIONS
  // =========================================================

  async findMySubscriptions(authenticatedUser: AuthenticatedUser) {
    this.requireAuthenticatedUser(authenticatedUser);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: authenticatedUser.id,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        cohort: true,

        studentCohort: {
          include: {
            cohort: true,
          },
        },

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return this.expireSubscriptions(subscriptions);
  }

  // =========================================================
  // FIND ONE SUBSCRIPTION
  // =========================================================

  async findOne(id: string, authenticatedUser: AuthenticatedUser) {
    this.requireAuthenticatedUser(authenticatedUser);

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        cohort: true,

        studentCohort: {
          include: {
            cohort: true,
          },
        },

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found.');
    }

    // -------------------------------------------------------
    // OWNERSHIP
    // -------------------------------------------------------

    if (
      subscription.userId !== authenticatedUser.id &&
      authenticatedUser.role !== 'ADMIN'
    ) {
      throw new UnauthorizedException(
        'You are not authorized to view this subscription.',
      );
    }

    // -------------------------------------------------------
    // EXPIRE WHEN COHORT/SUBSCRIPTION ENDS
    // -------------------------------------------------------

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate &&
      subscription.endDate <= new Date()
    ) {
      return this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },

        data: {
          status: SubscriptionStatus.EXPIRED,
        },

        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },

          cohort: true,

          studentCohort: {
            include: {
              cohort: true,
            },
          },

          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    return subscription;
  }

  // =========================================================
  // FIND SUBSCRIPTION FOR A SPECIFIC COHORT
  // =========================================================

  async findMyCohortSubscription(
    cohortId: string,
    authenticatedUser: AuthenticatedUser,
  ) {
    this.requireAuthenticatedUser(authenticatedUser);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: authenticatedUser.id,
        cohortId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        cohort: true,

        studentCohort: true,

        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription exists for this cohort.');
    }

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.endDate &&
      subscription.endDate <= new Date()
    ) {
      return this.prisma.subscription.update({
        where: {
          id: subscription.id,
        },

        data: {
          status: SubscriptionStatus.EXPIRED,
        },

        include: {
          cohort: true,
          studentCohort: true,

          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    return subscription;
  }

  // =========================================================
  // EXPIRE SUBSCRIPTIONS
  // =========================================================

  private async expireSubscriptions<
    T extends {
      id: string;
      status: SubscriptionStatus;
      endDate: Date | null;
    },
  >(subscriptions: T[]) {
    const now = new Date();

    for (const subscription of subscriptions) {
      if (
        subscription.status === SubscriptionStatus.ACTIVE &&
        subscription.endDate &&
        subscription.endDate <= now
      ) {
        await this.prisma.subscription.update({
          where: {
            id: subscription.id,
          },

          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        });

        subscription.status = SubscriptionStatus.EXPIRED;
      }
    }

    return subscriptions;
  }

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  private requireAuthenticatedUser(authenticatedUser: AuthenticatedUser) {
    if (!authenticatedUser?.id) {
      throw new UnauthorizedException('Authenticated user is required.');
    }
  }

  // =========================================================
  // ADMIN AUTHORIZATION
  // =========================================================

  private requireAdmin(authenticatedUser: AuthenticatedUser) {
    this.requireAuthenticatedUser(authenticatedUser);

    if (authenticatedUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Administrator access is required.');
    }
  }
}
