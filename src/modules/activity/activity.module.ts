// activity.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';      // <-- CACHE_MANAGER
import { Activity } from './entities/activity.entity';
import { ActivityReport } from './entities/activity-report.entity';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { AdminModule } from '../admin/admin.module';
import { UserModule } from '../user/user.module';                 // <--+
import { UserInterestsModule } from '../user-interests/user-interests.module'; // <--+
import { BondsModule } from '../bonds/bonds.module';              // <--+

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityReport]),
    CacheModule.register(), // gives CACHE_MANAGER
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
      global: true,
    }),
    forwardRef(() => AdminModule),
    UserModule,           // exports TypeOrmModule.forFeature([User])
    UserInterestsModule,  // exports TypeOrmModule.forFeature([UserInterest])
    BondsModule,          // exports TypeOrmModule.forFeature([Bond])
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}