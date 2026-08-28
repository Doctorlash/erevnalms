import { Test, TestingModule } from '@nestjs/testing';
import { ExamAttemptsController } from './exam-attempts.controller';

describe('ExamAttemptsController', () => {
  let controller: ExamAttemptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamAttemptsController],
    }).compile();

    controller = module.get<ExamAttemptsController>(ExamAttemptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
