import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Country } from './entities/country.entity';
import { AdminModule } from '../admin/admin.module'; // Import AdminModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Country]),
    AdminModule, // Import AdminModule to get access to AdminGuard and JwtService
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}