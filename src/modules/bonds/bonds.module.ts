// bonds.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BondsAdminController } from './bonds.controller';
import { BondsService } from './bonds.service';
import { Bond } from './entities/bond.entity';
import { BondReport } from './entities/bond-report.entity';
import { User } from '../user/entities/user.entity';
import { ZeptomailApiModule } from '../../third-party/zeptomail-api/zeptomail-api.module';
import { AdminModule } from '../admin/admin.module'; // <-- add this
import { UserInterest } from '../user-interests/entities/user-interest.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Bond, BondReport, User, UserInterest]),
    CacheModule.register({ ttl: 300, max: 100 }),
    ZeptomailApiModule,
    AdminModule, // <-- and this
  ],
  controllers: [BondsAdminController],
  providers: [BondsService],
  exports: [BondsService, TypeOrmModule],
})
export class BondsModule {}