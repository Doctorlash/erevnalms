/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import PDFDocument from 'pdfkit';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a certificate for a completed student cohort.
   *
   * Certificate eligibility is checked server-side.
   */
  async generateForStudentCohort(studentCohortId: string) {
    const studentCohort = await this.prisma.studentCohort.findUnique({
      where: {
        id: studentCohortId,
      },
      include: {
        user: true,
        cohort: true,
      },
    });

    if (!studentCohort) {
      throw new NotFoundException('Student cohort not found');
    }

    const existingCertificate = await this.prisma.certificate.findUnique({
      where: {
        studentCohortId,
      },
    });

    if (existingCertificate) {
      return existingCertificate;
    }

    if (
      studentCohort.status === 'WITHDRAWN' ||
      studentCohort.status === 'SUSPENDED'
    ) {
      throw new BadRequestException(
        'Student is not eligible for a certificate from this cohort',
      );
    }

    const now = new Date();

    if (now < studentCohort.cohort.endDate) {
      throw new BadRequestException(
        'The cohort has not reached its completion date',
      );
    }

    if (studentCohort.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Student cohort must be marked as completed before a certificate can be issued',
      );
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: studentCohort.userId,
        programme: studentCohort.cohort.programme,
        OR: [
          {
            cohortId: studentCohort.cohortId,
          },
          {
            studentCohortId: studentCohort.id,
          },
        ],
      },
      select: {
        subjectId: true,
      },
    });

    const subjectIds = [
      ...new Set(enrollments.map((enrollment) => enrollment.subjectId)),
    ];

    if (subjectIds.length === 0) {
      throw new BadRequestException(
        'Student has no enrolled subjects for this cohort',
      );
    }

    /*
     * ---------------------------------------------------------
     * LESSON COMPLETION
     * ---------------------------------------------------------
     */

    const requiredLessons = await this.prisma.lesson.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        isPublished: true,
      },
      select: {
        id: true,
      },
    });

    if (requiredLessons.length > 0) {
      const lessonProgress = await this.prisma.lessonProgress.findMany({
        where: {
          userId: studentCohort.userId,
          lessonId: {
            in: requiredLessons.map((lesson) => lesson.id),
          },
          completed: true,
        },
        select: {
          lessonId: true,
        },
      });

      const completedLessonIds = new Set(
        lessonProgress.map((progress) => progress.lessonId),
      );

      const incompleteLessons = requiredLessons.filter(
        (lesson) => !completedLessonIds.has(lesson.id),
      );

      if (incompleteLessons.length > 0) {
        throw new BadRequestException(
          `Student has ${incompleteLessons.length} incomplete published lesson(s)`,
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * ASSIGNMENT COMPLETION
     * ---------------------------------------------------------
     *
     * Required assignments are:
     * - published
     * - attached to one of the student's enrolled subjects
     * - either specifically attached to this cohort OR legacy/global
     *
     * A submission must exist and be graded.
     */

    const requiredAssignments = await this.prisma.assignment.findMany({
      where: {
        subjectId: {
          in: subjectIds,
        },
        isPublished: true,
        OR: [
          {
            cohortId: studentCohort.cohortId,
          },
          {
            cohortId: null,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (requiredAssignments.length > 0) {
      const submissions = await this.prisma.assignmentSubmission.findMany({
        where: {
          studentId: studentCohort.userId,
          assignmentId: {
            in: requiredAssignments.map((assignment) => assignment.id),
          },
          gradedAt: {
            not: null,
          },
        },
        select: {
          assignmentId: true,
        },
      });

      const gradedAssignmentIds = new Set(
        submissions.map((submission) => submission.assignmentId),
      );

      const incompleteAssignments = requiredAssignments.filter(
        (assignment) => !gradedAssignmentIds.has(assignment.id),
      );

      if (incompleteAssignments.length > 0) {
        throw new BadRequestException(
          `Student has ${incompleteAssignments.length} incomplete assignment(s)`,
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * FINAL EXAM COMPLETION
     * ---------------------------------------------------------
     *
     * Only published exams explicitly marked as final exams
     * for this cohort are required.
     */

    const finalExams = await this.prisma.exam.findMany({
      where: {
        cohortId: studentCohort.cohortId,
        isPublished: true,
        isFinalExam: true,
        subjectId: {
          in: subjectIds,
        },
      },
      select: {
        id: true,
        title: true,
        subjectId: true,
      },
    });

    if (finalExams.length === 0) {
      throw new BadRequestException(
        'No published final examination has been configured for this cohort',
      );
    }

    const finalExamIds = finalExams.map((exam) => exam.id);

    const passedAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId: studentCohort.userId,
        examId: {
          in: finalExamIds,
        },
        completed: true,
        score: {
          gte: 50,
        },
      },
      select: {
        examId: true,
      },
    });

    const passedExamIds = new Set(
      passedAttempts.map((attempt) => attempt.examId),
    );

    const incompleteFinalExams = finalExams.filter(
      (exam) => !passedExamIds.has(exam.id),
    );

    if (incompleteFinalExams.length > 0) {
      throw new BadRequestException(
        `Student has ${incompleteFinalExams.length} final examination(s) that have not been passed`,
      );
    }

    /*
     * ---------------------------------------------------------
     * CERTIFICATE CREATION
     * ---------------------------------------------------------
     */

    const certificateNumber = await this.createUniqueCertificateNumber();

    const verificationCode = await this.createUniqueVerificationCode();

    const completionDate =
      studentCohort.completedAt ?? studentCohort.cohort.endDate;

    return this.prisma.certificate.create({
      data: {
        userId: studentCohort.userId,
        studentCohortId: studentCohort.id,
        cohortId: studentCohort.cohortId,
        programme: studentCohort.cohort.programme,

        certificateNumber,
        verificationCode,

        completionDate,
        issuedAt: now,

        status: 'ISSUED',
      },
      include: {
        user: true,
        cohort: true,
        studentCohort: true,
      },
    });
  }

  /**
   * Backward-compatible entry point.
   *
   * New certificates must be generated from a StudentCohort.
   */
  async generate(data: { studentCohortId: string }) {
    return this.generateForStudentCohort(data.studentCohortId);
  }

  async studentCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: {
        userId,
      },
      include: {
        cohort: true,
        studentCohort: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        cohort: true,
        studentCohort: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate;
  }

  async verify(certificateNumber: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        certificateNumber,
      },
      include: {
        user: true,
        cohort: true,
        studentCohort: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      certificateNumber: certificate.certificateNumber,
      verificationCode: certificate.verificationCode,

      studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,

      programme: certificate.programme,

      cohort: {
        id: certificate.cohort.id,
        name: certificate.cohort.name,
        startDate: certificate.cohort.startDate,
        endDate: certificate.cohort.endDate,
      },

      completionDate: certificate.completionDate,
      issuedAt: certificate.issuedAt,

      status: certificate.status,
      valid: certificate.status === 'ISSUED',

      revokedAt: certificate.revokedAt,
      revocationReason: certificate.revocationReason,

      platform: 'Erevna LMS',
    };
  }

  async generatePdf(id: string): Promise<Buffer> {
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        cohort: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return new Promise<Buffer>((resolve, reject) => {
      const document = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });

      const chunks: Buffer[] = [];

      document.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      document.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      document.on('error', reject);

      const width = document.page.width;
      const height = document.page.height;

      /*
       * ---------------------------------------------------------
       * CERTIFICATE TEMPLATE
       * ---------------------------------------------------------
       */

      document
        .lineWidth(8)
        .rect(25, 25, width - 50, height - 50)
        .stroke();

      document
        .lineWidth(2)
        .rect(38, 38, width - 76, height - 76)
        .stroke();

      document.fontSize(18).font('Helvetica').text('EREVNA LMS', 0, 75, {
        align: 'center',
        width,
      });

      document
        .fontSize(34)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 115, {
          align: 'center',
          width,
        });

      document
        .fontSize(16)
        .font('Helvetica')
        .text('This certificate is proudly presented to', 0, 180, {
          align: 'center',
          width,
        });

      document
        .fontSize(38)
        .font('Helvetica-Bold')
        .text(
          `${certificate.user.firstName} ${certificate.user.lastName}`,
          70,
          220,
          {
            align: 'center',
            width: width - 140,
          },
        );

      document
        .lineWidth(1)
        .moveTo(190, 270)
        .lineTo(width - 190, 270)
        .stroke();

      document
        .fontSize(16)
        .font('Helvetica')
        .text(
          `for successfully completing the ${certificate.cohort.name}`,
          0,
          300,
          {
            align: 'center',
            width,
          },
        );

      document
        .fontSize(19)
        .font('Helvetica-Bold')
        .text(`${certificate.programme} PROGRAMME`, 0, 330, {
          align: 'center',
          width,
        });

      document
        .fontSize(13)
        .font('Helvetica')
        .text(
          `Cohort period: ${this.formatDate(
            certificate.cohort.startDate,
          )} – ${this.formatDate(certificate.cohort.endDate)}`,
          0,
          370,
          {
            align: 'center',
            width,
          },
        );

      document
        .fontSize(12)
        .text(
          `Completion date: ${this.formatDate(certificate.completionDate)}`,
          80,
          height - 125,
        );

      document
        .fontSize(12)
        .text(
          `Certificate No.: ${certificate.certificateNumber}`,
          0,
          height - 125,
          {
            align: 'center',
            width,
          },
        );

      document
        .fontSize(11)
        .text(
          'Verify this certificate through the Erevna LMS certificate verification system.',
          0,
          height - 90,
          {
            align: 'center',
            width,
          },
        );

      document.end();
    });
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private async createUniqueCertificateNumber(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const year = new Date().getFullYear();

      const randomPart = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

      const certificateNumber = `EREVNA-${year}-${randomPart}`;

      const existing = await this.prisma.certificate.findUnique({
        where: {
          certificateNumber,
        },
      });

      if (!existing) {
        return certificateNumber;
      }
    }

    throw new BadRequestException(
      'Unable to generate a unique certificate number',
    );
  }

  private async createUniqueVerificationCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 14)
        .toUpperCase();

      const verificationCode = `EV-${randomPart}`;

      const existing = await this.prisma.certificate.findUnique({
        where: {
          verificationCode,
        },
      });

      if (!existing) {
        return verificationCode;
      }
    }

    throw new BadRequestException(
      'Unable to generate a unique verification code',
    );
  }
}
