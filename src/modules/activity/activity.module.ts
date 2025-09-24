import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from '../admin/admin.module'; // <-- add
import { Activity } from './entities/activity.entity';
import { ActivityReport } from './entities/activity-report.entity';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, ActivityReport]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
      global: true,
    }),
    forwardRef(() => AdminModule), // <-- provides AdminService
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}