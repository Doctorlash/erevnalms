import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EnrollmentType,
  Prisma,
  StudentProgrammeType,
  SubjectRequestStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewSubjectRequestDto,
  SubjectRequestReviewAction,
} from './dto/review-subject-request.dto';
import { BulkReviewSubjectRequestDto } from './dto/bulk-review-subject-request.dto';

@Injectable()
export class SubjectRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // HELPERS
  // ============================================================

  private validateProgramme(programme: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }
  }

  private validateRejectionReason(
    action: SubjectRequestReviewAction,
    rejectionReason?: string,
  ): string | null {
    if (action === SubjectRequestReviewAction.REJECT) {
      const cleanedReason = rejectionReason?.trim();

      if (!cleanedReason) {
        throw new BadRequestException(
          'A rejection reason is required when rejecting a subject request.',
        );
      }

      return cleanedReason;
    }

    return null;
  }

  /**
   * A student can only receive ONE FREE subject for life.
   *
   * An expired FREE enrollment still counts because the student
   * has already consumed their one free-subject entitlement.
   */
  private async hasUsedFreeEnrollment(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<boolean> {
    const freeEnrollment = await tx.enrollment.findFirst({
      where: {
        userId,
        type: EnrollmentType.FREE,
      },
      select: {
        id: true,
      },
    });

    return Boolean(freeEnrollment);
  }

  // ============================================================
  // ADMIN
  // GET PENDING SUBJECT REQUESTS
  // ============================================================

  async getPendingRequests() {
    return this.prisma.subjectRequest.findMany({
      where: {
        status: SubjectRequestStatus.PENDING,
        programme: {
          in: [StudentProgrammeType.JAMB, StudentProgrammeType.WAEC],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'asc',
      },
    });
  }

  // ============================================================
  // ADMIN
  // GET ALL SUBJECT REQUESTS
  // ============================================================

  async getAllRequests(
    status?: SubjectRequestStatus,
    programme?: StudentProgrammeType,
  ) {
    if (programme) {
      this.validateProgramme(programme);
    }

    return this.prisma.subjectRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(programme
          ? {
              programme,
            }
          : {
              programme: {
                in: [StudentProgrammeType.JAMB, StudentProgrammeType.WAEC],
              },
            }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  // ============================================================
  // ADMIN
  // GET ONE REQUEST
  // ============================================================

  async getOneRequest(id: string) {
    const request = await this.prisma.subjectRequest.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Subject request not found.');
    }

    return request;
  }

  // ============================================================
  // STUDENT
  // GET MY SUBJECT REQUESTS
  // ============================================================

  async getStudentRequests(userId: string) {
    return this.prisma.subjectRequest.findMany({
      where: {
        userId,
        programme: {
          in: [StudentProgrammeType.JAMB, StudentProgrammeType.WAEC],
        },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            description: true,
            programme: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  // ============================================================
  // ADMIN
  // APPROVE ONE REQUEST
  // ============================================================

  async approveRequest(requestId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const request = await tx.subjectRequest.findUnique({
        where: {
          id: requestId,
        },
        include: {
          user: true,
          subject: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Subject request not found.');
      }

      this.validateProgramme(request.programme);

      if (request.status === SubjectRequestStatus.APPROVED) {
        throw new ConflictException(
          'This subject request has already been approved.',
        );
      }

      if (request.status === SubjectRequestStatus.REJECTED) {
        throw new ConflictException(
          'A rejected request cannot be approved. The student must submit a new request.',
        );
      }

      if (request.status !== SubjectRequestStatus.PENDING) {
        throw new ConflictException(
          'This subject request is no longer pending.',
        );
      }

      if (request.user.role !== 'STUDENT') {
        throw new ConflictException(
          'Only student subject requests can be approved.',
        );
      }

      if (!request.user.isActive) {
        throw new ConflictException('This student account is not active.');
      }

      if (!request.subject.isActive) {
        throw new ConflictException('This subject is currently inactive.');
      }

      if (request.subject.programme !== request.programme) {
        throw new ConflictException(
          'The requested subject does not belong to the selected programme.',
        );
      }

      // --------------------------------------------------------
      // Check whether the student is already enrolled
      // --------------------------------------------------------

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_subjectId: {
            userId: request.userId,
            subjectId: request.subjectId,
          },
        },
        include: {
          subject: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (existingEnrollment) {
        const reviewedAt = new Date();

        const updatedRequestResult = await tx.subjectRequest.updateMany({
          where: {
            id: request.id,
            status: SubjectRequestStatus.PENDING,
          },
          data: {
            status: SubjectRequestStatus.APPROVED,
            reviewedAt,
            rejectionReason: null,
          },
        });

        if (updatedRequestResult.count !== 1) {
          throw new ConflictException(
            'This subject request has already been reviewed by another admin.',
          );
        }

        const updatedRequest = await tx.subjectRequest.findUnique({
          where: {
            id: request.id,
          },
        });

        return {
          message:
            'Subject request approved. Student was already enrolled in this subject.',
          request: updatedRequest,
          enrollment: existingEnrollment,
          access:
            existingEnrollment.type === EnrollmentType.FREE ? 'FREE' : 'PAID',
        };
      }

      // --------------------------------------------------------
      // Check student's one-time FREE entitlement
      // --------------------------------------------------------

      const hasUsedFree = await this.hasUsedFreeEnrollment(tx, request.userId);

      // --------------------------------------------------------
      // FIRST FREE SUBJECT
      // --------------------------------------------------------

      if (!hasUsedFree) {
        const enrolledAt = new Date();

        const expiresAt = new Date(enrolledAt);
        expiresAt.setDate(expiresAt.getDate() + 7);

        const enrollment = await tx.enrollment.create({
          data: {
            userId: request.userId,
            subjectId: request.subjectId,
            programme: request.programme,
            type: EnrollmentType.FREE,
            enrolledAt,
            expiresAt,
          },
          include: {
            subject: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        const reviewedAt = new Date();

        const updatedRequestResult = await tx.subjectRequest.updateMany({
          where: {
            id: request.id,
            status: SubjectRequestStatus.PENDING,
          },
          data: {
            status: SubjectRequestStatus.APPROVED,
            reviewedAt,
            rejectionReason: null,
          },
        });

        if (updatedRequestResult.count !== 1) {
          throw new ConflictException(
            'This subject request has already been reviewed by another admin.',
          );
        }

        const updatedRequest = await tx.subjectRequest.findUnique({
          where: {
            id: request.id,
          },
        });

        return {
          message:
            'Subject request approved successfully. This is the student’s one free subject and access is valid for 7 days.',
          request: updatedRequest,
          enrollment,
          access: 'FREE',
          expiresAt,
        };
      }

      // --------------------------------------------------------
      // ADDITIONAL SUBJECT
      // --------------------------------------------------------
      // Do NOT create a fake PAID enrollment.
      // Payment/subscription will create the PAID enrollment
      // later when that feature is implemented.
      // --------------------------------------------------------

      const reviewedAt = new Date();

      const updatedRequestResult = await tx.subjectRequest.updateMany({
        where: {
          id: request.id,
          status: SubjectRequestStatus.PENDING,
        },
        data: {
          status: SubjectRequestStatus.APPROVED,
          reviewedAt,
          rejectionReason: null,
        },
      });

      if (updatedRequestResult.count !== 1) {
        throw new ConflictException(
          'This subject request has already been reviewed by another admin.',
        );
      }

      const updatedRequest = await tx.subjectRequest.findUnique({
        where: {
          id: request.id,
        },
      });

      return {
        message:
          'Subject request approved. Payment is required before access can be granted because the student has already used their one free subject.',
        request: updatedRequest,
        enrollment: null,
        access: 'PAYMENT_REQUIRED',
      };
    });
  }

  // ============================================================
  // ADMIN
  // REJECT ONE REQUEST
  // ============================================================

  async rejectRequest(requestId: string, reason: string) {
    const cleanedReason = reason?.trim();

    if (!cleanedReason) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const request = await this.prisma.subjectRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      throw new NotFoundException('Subject request not found.');
    }

    if (request.status === SubjectRequestStatus.APPROVED) {
      throw new ConflictException(
        'An approved subject request cannot be rejected.',
      );
    }

    if (request.status === SubjectRequestStatus.REJECTED) {
      throw new ConflictException(
        'This subject request has already been rejected.',
      );
    }

    const updatedResult = await this.prisma.subjectRequest.updateMany({
      where: {
        id: requestId,
        status: SubjectRequestStatus.PENDING,
      },
      data: {
        status: SubjectRequestStatus.REJECTED,
        rejectionReason: cleanedReason,
        reviewedAt: new Date(),
      },
    });

    if (updatedResult.count !== 1) {
      throw new ConflictException(
        'This subject request has already been reviewed by another admin.',
      );
    }

    return this.prisma.subjectRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            programme: true,
          },
        },
      },
    });
  }

  // ============================================================
  // ADMIN
  // REVIEW ONE REQUEST
  // ============================================================

  async reviewRequest(requestId: string, dto: ReviewSubjectRequestDto) {
    const rejectionReason = this.validateRejectionReason(
      dto.action,
      dto.rejectionReason,
    );

    if (dto.action === SubjectRequestReviewAction.APPROVE) {
      return this.approveRequest(requestId);
    }

    return this.rejectRequest(requestId, rejectionReason!);
  }

  // ============================================================
  // ADMIN
  // BULK REVIEW
  // ============================================================

  async bulkReviewRequests(dto: BulkReviewSubjectRequestDto) {
    if (!dto.requestIds?.length) {
      throw new BadRequestException(
        'At least one subject request must be selected.',
      );
    }

    const rejectionReason = this.validateRejectionReason(
      dto.action,
      dto.rejectionReason,
    );

    // Remove duplicate IDs before processing.
    const requestIds = [...new Set(dto.requestIds)];

    // ==========================================================
    // APPROVE ALL
    // ==========================================================

    if (dto.action === SubjectRequestReviewAction.APPROVE) {
      return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        /*
         * IMPORTANT:
         *
         * The requests are deliberately fetched INSIDE the
         * transaction.
         *
         * The previous implementation fetched and validated
         * them before opening the transaction. That allowed
         * another admin to review one of the requests between
         * validation and the actual bulk update.
         */
        const requests = await tx.subjectRequest.findMany({
          where: {
            id: {
              in: requestIds,
            },
          },
          include: {
            user: true,
            subject: true,
          },
        });

        if (requests.length !== requestIds.length) {
          throw new NotFoundException(
            'One or more selected subject requests could not be found.',
          );
        }

        // ------------------------------------------------------
        // Revalidate the CURRENT state inside the transaction.
        // ------------------------------------------------------

        for (const request of requests) {
          this.validateProgramme(request.programme);

          if (request.status !== SubjectRequestStatus.PENDING) {
            throw new ConflictException(
              `Subject request ${request.id} is no longer pending. The bulk operation was cancelled.`,
            );
          }

          if (request.user.role !== 'STUDENT') {
            throw new ConflictException(
              `Subject request ${request.id} does not belong to a student.`,
            );
          }

          if (!request.user.isActive) {
            throw new ConflictException(
              `Student account for request ${request.id} is not active.`,
            );
          }

          if (!request.subject.isActive) {
            throw new ConflictException(
              `Subject for request ${request.id} is currently inactive.`,
            );
          }

          if (request.subject.programme !== request.programme) {
            throw new ConflictException(
              `Subject and programme do not match for request ${request.id}.`,
            );
          }
        }

        const results: Array<{
          requestId: string;
          enrollment: unknown;
          access: 'FREE' | 'PAYMENT_REQUIRED' | 'EXISTING';
          expiresAt?: Date;
        }> = [];

        /*
         * Tracks a FREE entitlement assigned during THIS bulk
         * transaction.
         *
         * This prevents two requests for the same student in
         * this same bulk operation from receiving two FREE
         * enrollments.
         *
         * The database-level one-FREE-per-user unique index
         * remains the final protection against concurrent
         * transactions.
         */
        const freeAssignedToStudent = new Set<string>();

        for (const request of requests) {
          // ----------------------------------------------------
          // Check existing enrollment
          // ----------------------------------------------------

          const existingEnrollment = await tx.enrollment.findUnique({
            where: {
              userId_subjectId: {
                userId: request.userId,
                subjectId: request.subjectId,
              },
            },
          });

          if (existingEnrollment) {
            /*
             * Atomic PENDING -> APPROVED transition.
             *
             * If another admin reviewed this request while the
             * bulk transaction was running, count will be 0.
             *
             * Throwing here causes the entire transaction to
             * roll back.
             */
            const updatedRequestResult = await tx.subjectRequest.updateMany({
              where: {
                id: request.id,
                status: SubjectRequestStatus.PENDING,
              },
              data: {
                status: SubjectRequestStatus.APPROVED,
                reviewedAt: new Date(),
                rejectionReason: null,
              },
            });

            if (updatedRequestResult.count !== 1) {
              throw new ConflictException(
                `Subject request ${request.id} has already been reviewed by another admin. The bulk operation was cancelled.`,
              );
            }

            results.push({
              requestId: request.id,
              enrollment: existingEnrollment,
              access:
                existingEnrollment.type === EnrollmentType.FREE
                  ? 'FREE'
                  : 'EXISTING',
              ...(existingEnrollment.expiresAt
                ? {
                    expiresAt: existingEnrollment.expiresAt,
                  }
                : {}),
            });

            continue;
          }

          // ----------------------------------------------------
          // Determine FREE entitlement
          // ----------------------------------------------------

          let hasUsedFree = freeAssignedToStudent.has(request.userId);

          if (!hasUsedFree) {
            hasUsedFree = await this.hasUsedFreeEnrollment(tx, request.userId);
          }

          // ----------------------------------------------------
          // FIRST FREE SUBJECT
          // ----------------------------------------------------

          if (!hasUsedFree) {
            const enrolledAt = new Date();

            const expiresAt = new Date(enrolledAt);
            expiresAt.setDate(expiresAt.getDate() + 7);

            const enrollment = await tx.enrollment.create({
              data: {
                userId: request.userId,
                subjectId: request.subjectId,
                programme: request.programme,
                type: EnrollmentType.FREE,
                enrolledAt,
                expiresAt,
              },
            });

            freeAssignedToStudent.add(request.userId);

            /*
             * The request transition is conditional.
             *
             * If another admin has already reviewed this request,
             * this returns 0 and the exception rolls back the FREE
             * enrollment created immediately above.
             */
            const updatedRequestResult = await tx.subjectRequest.updateMany({
              where: {
                id: request.id,
                status: SubjectRequestStatus.PENDING,
              },
              data: {
                status: SubjectRequestStatus.APPROVED,
                reviewedAt: new Date(),
                rejectionReason: null,
              },
            });

            if (updatedRequestResult.count !== 1) {
              throw new ConflictException(
                `Subject request ${request.id} has already been reviewed by another admin. The bulk operation was cancelled.`,
              );
            }

            results.push({
              requestId: request.id,
              enrollment,
              access: 'FREE',
              expiresAt,
            });

            continue;
          }

          // ----------------------------------------------------
          // ADDITIONAL SUBJECT
          // ----------------------------------------------------
          // Do NOT create a PAID enrollment here.
          // Payment will create that enrollment later.
          // ----------------------------------------------------

          const updatedRequestResult = await tx.subjectRequest.updateMany({
            where: {
              id: request.id,
              status: SubjectRequestStatus.PENDING,
            },
            data: {
              status: SubjectRequestStatus.APPROVED,
              reviewedAt: new Date(),
              rejectionReason: null,
            },
          });

          if (updatedRequestResult.count !== 1) {
            throw new ConflictException(
              `Subject request ${request.id} has already been reviewed by another admin. The bulk operation was cancelled.`,
            );
          }

          results.push({
            requestId: request.id,
            enrollment: null,
            access: 'PAYMENT_REQUIRED',
          });
        }

        const freeCount = results.filter(
          (result) => result.access === 'FREE',
        ).length;

        const paymentRequiredCount = results.filter(
          (result) => result.access === 'PAYMENT_REQUIRED',
        ).length;

        const existingCount = results.filter(
          (result) => result.access === 'EXISTING',
        ).length;

        return {
          message:
            paymentRequiredCount > 0
              ? `${requests.length} subject request(s) approved. ${freeCount} received free access, ${paymentRequiredCount} require payment, and ${existingCount} were already enrolled.`
              : `${requests.length} subject request(s) approved successfully.`,
          count: requests.length,
          freeCount,
          paymentRequiredCount,
          existingCount,
          results,
        };
      });
    }

    // ==========================================================
    // REJECT ALL
    // ==========================================================

    const updatedRequests = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        /*
         * Fetch the current requests INSIDE the transaction.
         *
         * This eliminates the stale-validation window that existed
         * when requests were fetched before the transaction started.
         */
        const requests = await tx.subjectRequest.findMany({
          where: {
            id: {
              in: requestIds,
            },
          },
          include: {
            user: true,
            subject: true,
          },
        });

        if (requests.length !== requestIds.length) {
          throw new NotFoundException(
            'One or more selected subject requests could not be found.',
          );
        }

        // --------------------------------------------------------
        // Validate current state inside transaction
        // --------------------------------------------------------

        for (const request of requests) {
          this.validateProgramme(request.programme);

          if (request.status !== SubjectRequestStatus.PENDING) {
            throw new ConflictException(
              `Subject request ${request.id} is no longer pending. The bulk operation was cancelled.`,
            );
          }

          if (request.user.role !== 'STUDENT') {
            throw new ConflictException(
              `Subject request ${request.id} does not belong to a student.`,
            );
          }

          if (!request.user.isActive) {
            throw new ConflictException(
              `Student account for request ${request.id} is not active.`,
            );
          }

          if (!request.subject.isActive) {
            throw new ConflictException(
              `Subject for request ${request.id} is currently inactive.`,
            );
          }

          if (request.subject.programme !== request.programme) {
            throw new ConflictException(
              `Subject and programme do not match for request ${request.id}.`,
            );
          }
        }

        const results: Array<
          Prisma.SubjectRequestGetPayload<{
            include: {
              user: {
                select: {
                  id: true;
                  firstName: true;
                  lastName: true;
                  email: true;
                };
              };
              subject: {
                select: {
                  id: true;
                  name: true;
                  programme: true;
                };
              };
            };
          }>
        > = [];

        for (const request of requests) {
          /*
           * Atomic PENDING -> REJECTED transition.
           *
           * If another admin has approved/rejected this request
           * before this update, count becomes 0 and the exception
           * rolls the whole transaction back.
           */
          const updatedResult = await tx.subjectRequest.updateMany({
            where: {
              id: request.id,
              status: SubjectRequestStatus.PENDING,
            },
            data: {
              status: SubjectRequestStatus.REJECTED,
              rejectionReason: rejectionReason!,
              reviewedAt: new Date(),
            },
          });

          if (updatedResult.count !== 1) {
            throw new ConflictException(
              `Subject request ${request.id} has already been reviewed by another admin. The bulk operation was cancelled.`,
            );
          }

          const updated = await tx.subjectRequest.findUnique({
            where: {
              id: request.id,
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              subject: {
                select: {
                  id: true,
                  name: true,
                  programme: true,
                },
              },
            },
          });

          if (!updated) {
            throw new NotFoundException(
              `Subject request ${request.id} could not be retrieved after rejection.`,
            );
          }

          results.push(updated);
        }

        return results;
      },
    );

    return {
      message: `${updatedRequests.length} subject request(s) rejected.`,
      count: updatedRequests.length,
      requests: updatedRequests,
    };
  }

  // ============================================================
  // STUDENT
  // RESUBMIT REJECTED REQUEST
  // ============================================================

  async resubmitRequest(requestId: string, userId: string) {
    const request = await this.prisma.subjectRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        subject: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Subject request not found.');
    }

    if (request.userId !== userId) {
      throw new ForbiddenException(
        "You cannot resubmit another student's request.",
      );
    }

    this.validateProgramme(request.programme);

    if (request.status === SubjectRequestStatus.PENDING) {
      throw new ConflictException('This subject request is already pending.');
    }

    if (request.status === SubjectRequestStatus.APPROVED) {
      throw new ConflictException(
        'This subject request has already been approved.',
      );
    }

    if (!request.subject.isActive) {
      throw new ConflictException('This subject is currently inactive.');
    }

    if (request.subject.programme !== request.programme) {
      throw new ConflictException(
        'The subject does not belong to the requested programme.',
      );
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId: request.subjectId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('You are already enrolled in this subject.');
    }

    const existingPendingRequest = await this.prisma.subjectRequest.findFirst({
      where: {
        userId,
        subjectId: request.subjectId,
        programme: request.programme,
        status: SubjectRequestStatus.PENDING,
        NOT: {
          id: request.id,
        },
      },
    });

    if (existingPendingRequest) {
      throw new ConflictException(
        'You already have a pending request for this subject.',
      );
    }

    return this.prisma.subjectRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: SubjectRequestStatus.PENDING,
        rejectionReason: null,
        requestedAt: new Date(),
        reviewedAt: null,
      },
      include: {
        subject: true,
      },
    });
  }
}
