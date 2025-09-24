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
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { UserService } from './user.service';
  import { FindAllUsersDto } from './dto/find-all-users.dto';
  import { AdminGuard } from '../admin/guards/admin/admin.guard';
  
  @ApiTags('Users')
  @ApiBearerAuth('JWT-auth')
  @Controller('user')
  export class UserController {
    constructor(private readonly userService: UserService) {}
  
    @UseGuards(AdminGuard)
    @Get()
    @ApiOperation({ summary: 'Get all users (admin only)' })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    @ApiQuery({ name: 'search', required: false, example: 'john' })
    @ApiQuery({ name: 'email_verified', required: false, example: true })
    @ApiQuery({ name: 'phone_verified', required: false, example: true })
    @ApiQuery({ name: 'notification', required: false, example: true })
    async findAll(@Query(ValidationPipe) query: FindAllUsersDto) {
      return this.userService.findAll(query);
    }
  
    @UseGuards(AdminGuard)
    @Get('analytics/overview')
    @ApiOperation({ summary: 'Users overview analytics (sign-ups / active / churn)' })
    @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'], example: 'daily' })
    async getUsersOverview(@Query('period') period: 'daily'|'weekly'|'monthly' = 'daily') {
      return this.userService.getUsersOverview({ period });
    }
  
    @UseGuards(AdminGuard)
    @Get('analytics/demography')
    @ApiOperation({ summary: 'Users demography analytics (age / gender / country)' })
    async getUsersDemography() {
      return this.userService.getUsersDemography();
    }
  
    @UseGuards(AdminGuard)
    @Get('analytics/verification')
    @ApiOperation({ summary: 'Email vs Phone verification funnel' })
    async getVerificationFunnel() {
      return this.userService.getVerificationFunnel();
    }
  
    @UseGuards(AdminGuard)
    @Get('analytics/total')
    @ApiOperation({ summary: 'Total number of user accounts' })
    async getTotalUsers() {
      const total = await this.userService.getTotalUsers();
      return { total };
    }
  
    @UseGuards(AdminGuard)
    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (admin only)' })
    async findOne(@Param('id') id: string) {
      return this.userService.findOne(id, true);
    }
  
    @UseGuards(AdminGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete user (admin only)' })
    async remove(@Param('id') id: string) {
      return this.userService.remove(id);
    }
  }