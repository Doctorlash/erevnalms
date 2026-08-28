import { Controller, Get } from '@nestjs/common';

import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get()
  overallLeaderboard() {
    return this.leaderboardsService.overallLeaderboard();
  }

  @Get('students')
  topStudents() {
    return this.leaderboardsService.topStudents();
  }
}
