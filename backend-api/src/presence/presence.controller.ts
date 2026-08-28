import { Controller, Get, Param, Patch } from '@nestjs/common';
import { PresenceService } from './presence.service';

@Controller('presence')
export class PresenceController {
  constructor(private readonly service: PresenceService) {}

  @Patch('online/:id')
  online(
    @Param('id')
    id: string,
  ) {
    return this.service.goOnline(id);
  }

  @Patch('offline/:id')
  offline(
    @Param('id')
    id: string,
  ) {
    return this.service.goOffline(id);
  }

  @Get('status/:id')
  status(
    @Param('id')
    id: string,
  ) {
    return this.service.status(id);
  }
}
