import { Test, TestingModule } from '@nestjs/testing';
import { SubjectRequestsController } from './subject-requests.controller';

describe('SubjectRequestsController', () => {
  let controller: SubjectRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectRequestsController],
    }).compile();

    controller = module.get<SubjectRequestsController>(SubjectRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
