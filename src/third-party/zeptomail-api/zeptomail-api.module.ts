import { Module } from '@nestjs/common';
import { ZeptomailApiService } from './zeptomail-api.service';

@Module({
  providers: [ZeptomailApiService],
  exports: [ZeptomailApiService],
})
export class ZeptomailApiModule {}
