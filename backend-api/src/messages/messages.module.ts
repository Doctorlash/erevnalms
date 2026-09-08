import { Module } from '@nestjs/common';

import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';
import { PresenceModule } from '../presence/presence.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, PresenceModule],

  controllers: [MessagesController],

  providers: [MessagesService, MessagesGateway],

  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
