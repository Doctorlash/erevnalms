import { Module } from '@nestjs/common';

import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, CloudinaryService],
  exports: [ResourcesService, CloudinaryService],
})
export class ResourcesModule {}
