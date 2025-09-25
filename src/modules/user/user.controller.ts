import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { AdminGuard } from '../admin/guards/admin/admin.guard';

@ApiTags('Users (Admin)')
@ApiSecurity('JWT-auth')
@Controller('user')
@UseGuards(AdminGuard) // guard the whole controller
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (admin)' })
  async findAll(@Query(ValidationPipe) query: FindAllUsersDto) {
    return this.userService.findAll(query);
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Users overview analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })
  async getUsersOverview(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.userService.getUsersOverview({ period });
  }

  @Get('analytics/demography')
  @ApiOperation({ summary: 'Users demography analytics' })
  async getUsersDemography() {
    return this.userService.getUsersDemography();
  }

  @Get('analytics/verification')
  @ApiOperation({ summary: 'Email vs Phone verification funnel' })
  async getVerificationFunnel() {
    return this.userService.getVerificationFunnel();
  }

  @Get('analytics/total')
  @ApiOperation({ summary: 'Total number of user accounts' })
  async getTotalUsers() {
    return { total: await this.userService.getTotalUsers() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user (admin)' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}