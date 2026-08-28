import { Test, TestingModule } from '@nestjs/testing';
import { LiveClassesService } from './live-classes.service';

describe('LiveClassesService', () => {
  let service: LiveClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveClassesService],
    }).compile();

    service = module.get<LiveClassesService>(LiveClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
