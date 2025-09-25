import { Module } from '@nestjs/common';
import { UserInterestsService } from './user-interests.service';
import { UserInterestsController } from './user-interests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInterest } from './entities/user-interest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserInterest])],
  controllers: [UserInterestsController],
  providers: [UserInterestsService, Response],
  exports: [TypeOrmModule],

})
export class UserInterestsModule {}
