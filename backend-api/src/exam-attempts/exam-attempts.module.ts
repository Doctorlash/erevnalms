import { Module } from '@nestjs/common';

import { ExamAttemptsController } from './exam-attempts.controller';
import { ExamAttemptsService } from './exam-attempts.service';

import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [CertificatesModule],

  controllers: [ExamAttemptsController],

  providers: [ExamAttemptsService],

  exports: [ExamAttemptsService],
})
export class ExamAttemptsModule {}
