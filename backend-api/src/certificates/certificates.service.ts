/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import PDFDocument from 'pdfkit';

@Injectable()
export class CertificatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a certificate manually.
   * Kept because your existing system already uses this endpoint.
   */
  async generate(data: {
    userId: string;
    subjectId?: string;
    examId?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    /*
     * Prevent duplicate certificates for the same student/exam.
     */
    if (data.examId) {
      const existing = await this.prisma.certificate.findFirst({
        where: {
          userId: data.userId,
          examId: data.examId,
        },
        include: {
          user: true,
          subject: true,
          exam: true,
        },
      });

      if (existing) {
        return existing;
      }
    }

    const certificateNumber =
      'ERV-' +
      Date.now().toString().slice(-8) +
      '-' +
      Math.floor(100 + Math.random() * 900);

    return this.prisma.certificate.create({
      data: {
        userId: data.userId,
        subjectId: data.subjectId,
        examId: data.examId,
        certificateNumber,
      },

      include: {
        user: true,
        subject: true,
        exam: true,
      },
    });
  }

  /**
   * Automatically generate a certificate after a student
   * successfully completes an exam.
   *
   * Current Erevna pass mark: 50%.
   */
  async generateForPassedExam(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
      },

      include: {
        user: true,

        exam: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Exam attempt not found');
    }

    if (!attempt.completed) {
      throw new BadRequestException(
        'Certificate cannot be generated before the exam is completed.',
      );
    }

    /*
     * Erevna pass mark.
     */
    if (attempt.score < 50) {
      return {
        eligible: false,
        message: 'Student did not meet the certificate pass mark.',
        certificate: null,
      };
    }

    /*
     * Prevent duplicate certificates.
     */
    const existing = await this.prisma.certificate.findFirst({
      where: {
        userId: attempt.userId,
        examId: attempt.examId,
      },

      include: {
        user: true,
        subject: true,
        exam: true,
      },
    });

    if (existing) {
      return {
        eligible: true,
        alreadyGenerated: true,
        message: 'Certificate already exists.',
        certificate: existing,
      };
    }

    const certificateNumber =
      'ERV-' +
      Date.now().toString().slice(-8) +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const certificate = await this.prisma.certificate.create({
      data: {
        userId: attempt.userId,
        subjectId: attempt.exam.subjectId,
        examId: attempt.examId,
        certificateNumber,
      },

      include: {
        user: true,
        subject: true,
        exam: true,
      },
    });

    return {
      eligible: true,
      alreadyGenerated: false,
      message: 'Certificate generated successfully.',
      certificate,
    };
  }

  /**
   * Get all certificates belonging to a student.
   */
  async studentCertificates(userId: string) {
    return this.prisma.certificate.findMany({
      where: {
        userId,
      },

      include: {
        subject: true,
        exam: true,
      },

      orderBy: {
        issuedAt: 'desc',
      },
    });
  }

  /**
   * Find one certificate.
   */
  async findOne(id: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
        subject: true,
        exam: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate;
  }

  /**
   * Public certificate verification.
   */
  async verify(certificateNumber: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: {
        certificateNumber,
      },

      include: {
        user: true,
        subject: true,
        exam: true,
      },
    });

    if (!certificate) {
      return {
        valid: false,
        message: 'Certificate not found.',
      };
    }

    return {
      valid: true,

      certificate: {
        certificateNumber: certificate.certificateNumber,

        studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,

        subject: certificate.subject?.name || 'General',

        exam: certificate.exam?.title || 'N/A',

        issuedAt: certificate.issuedAt,

        platform: 'Erevna Leadership Academy',
      },
    };
  }

  /**
   * Generate certificate PDF.
   */
  async generatePdf(id: string): Promise<Buffer> {
    const certificate = await this.findOne(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      const width = doc.page.width;
      const height = doc.page.height;

      /*
       * Outer border
       */
      doc
        .lineWidth(5)
        .rect(25, 25, width - 50, height - 50)
        .stroke('#312e81');

      /*
       * Inner border
       */
      doc
        .lineWidth(1)
        .rect(38, 38, width - 76, height - 76)
        .stroke('#c7d2fe');

      /*
       * Academy heading
       */
      doc
        .fontSize(30)
        .fillColor('#312e81')
        .font('Helvetica-Bold')
        .text('EREVNA LEADERSHIP ACADEMY', 60, 70, {
          align: 'center',
          width: width - 120,
        });

      doc
        .fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Learning Management System', {
          align: 'center',
        });

      /*
       * Certificate title
       */
      doc
        .moveDown(2)
        .fontSize(32)
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF ACHIEVEMENT', {
          align: 'center',
        });

      doc
        .moveDown(0.8)
        .fontSize(15)
        .fillColor('#475569')
        .font('Helvetica')
        .text('This certificate is proudly presented to', {
          align: 'center',
        });

      /*
       * Student name
       */
      doc
        .moveDown(0.5)
        .fontSize(30)
        .fillColor('#312e81')
        .font('Helvetica-Bold')
        .text(`${certificate.user.firstName} ${certificate.user.lastName}`, {
          align: 'center',
        });

      /*
       * Achievement statement
       */
      doc
        .moveDown(0.8)
        .fontSize(15)
        .fillColor('#475569')
        .font('Helvetica')
        .text('for successfully completing the required academic assessment', {
          align: 'center',
        });

      /*
       * Subject
       */
      doc
        .moveDown(0.5)
        .fontSize(22)
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .text(certificate.subject?.name || 'Academic Programme', {
          align: 'center',
        });

      /*
       * Exam
       */
      if (certificate.exam?.title) {
        doc
          .moveDown(0.4)
          .fontSize(14)
          .fillColor('#64748b')
          .font('Helvetica')
          .text(`Assessment: ${certificate.exam.title}`, {
            align: 'center',
          });
      }

      /*
       * Certificate number and date
       */
      const bottomY = height - 135;

      doc
        .fontSize(12)
        .fillColor('#475569')
        .font('Helvetica')
        .text(`Certificate No: ${certificate.certificateNumber}`, 70, bottomY, {
          width: 300,
        });

      doc.text(
        `Issued: ${new Date(certificate.issuedAt).toLocaleDateString('en-NG')}`,
        width - 370,
        bottomY,
        {
          width: 300,
          align: 'right',
        },
      );

      /*
       * Verification instruction
       */
      doc
        .fontSize(10)
        .fillColor('#64748b')
        .text(
          'This certificate can be verified using the certificate number on the Erevna platform.',
          70,
          height - 80,
          {
            width: width - 140,
            align: 'center',
          },
        );

      doc.end();
    });
  }
}
