import { Test, TestingModule } from '@nestjs/testing';
import { LiveClassesController } from './live-classes.controller';

describe('LiveClassesController', () => {
  let controller: LiveClassesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LiveClassesController],
    }).compile();

    controller = module.get<LiveClassesController>(LiveClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
