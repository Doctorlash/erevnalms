import { Controller, Get, Param } from '@nestjs/common';

import { AiRecommendationsService } from './ai-recommendations.service';

@Controller('ai-recommendations')
export class AiRecommendationsController {
  constructor(private readonly service: AiRecommendationsService) {}

  @Get(':userId')
  recommendations(
    @Param('userId')
    userId: string,
  ) {
    return this.service.recommendations(userId);
  }
}
