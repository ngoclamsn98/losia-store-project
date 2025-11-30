import { Module } from '@nestjs/common';
import { ViettelPostService } from './viettel-post.service';
import { ViettelPostController } from './viettel-post.controller';

@Module({
  controllers: [ViettelPostController],
  providers: [ViettelPostService],
  exports: [ViettelPostService],
})
export class ViettelPostModule {}

