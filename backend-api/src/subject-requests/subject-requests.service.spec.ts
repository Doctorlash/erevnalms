import { Test, TestingModule } from '@nestjs/testing';
import { SubjectRequestsService } from './subject-requests.service';

describe('SubjectRequestsService', () => {
  let service: SubjectRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubjectRequestsService],
    }).compile();

    service = module.get<SubjectRequestsService>(SubjectRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
