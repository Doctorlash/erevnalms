import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';

import type { Response } from 'express';

import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Generate a certificate after the student's cohort
   * completion requirements have been satisfied.
   */
  @Post('generate')
  generate(
    @Body()
    body: {
      studentCohortId: string;
    },
  ) {
    return this.certificatesService.generate({
      studentCohortId: body.studentCohortId,
    });
  }

  @Get('student/:userId')
  studentCertificates(
    @Param('userId')
    userId: string,
  ) {
    return this.certificatesService.studentCertificates(userId);
  }

  /*
   * IMPORTANT:
   * This route must remain before @Get(':id').
   */
  @Get('verify/:certificateNumber')
  verify(
    @Param('certificateNumber')
    certificateNumber: string,
  ) {
    return this.certificatesService.verify(certificateNumber);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id')
    id: string,

    @Res()
    res: Response,
  ) {
    const pdf = await this.certificatesService.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="erevna-certificate-${id}.pdf"`,
      'Content-Length': pdf.length,
    });

    res.end(pdf);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.certificatesService.findOne(id);
  }
}
