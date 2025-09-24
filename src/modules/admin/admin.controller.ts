import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    HttpCode,
    HttpStatus,
    UnauthorizedException, // Add this import
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { AdminService } from './admin.service';
  import { AdminLoginDto } from './dto/admin-login/admin-login';
  import { AdminGuard } from './guards/admin/admin.guard';
  import { AdminUser } from './decorators/admin/admin.decorator';
  import { Admin } from './entities/admin.entity';
  
  @ApiTags('Admin')
  @Controller('admin')
  export class AdminController {
    constructor(private readonly adminService: AdminService) {}
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Admin login' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Login successful',
      schema: {
        example: {
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          admin: {
            id: 1,
            email: 'admin@bondsio.com',
            role: 'super_admin',
          },
        },
      },
    })
    @ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials',
    })
    async login(@Body() loginDto: AdminLoginDto) {
      const admin = await this.adminService.validateAdmin(loginDto);
      
      if (!admin) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      return this.adminService.login(admin);
    }
  
    @UseGuards(AdminGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get admin profile' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Admin profile retrieved successfully',
    })
    async getProfile(@AdminUser() admin: Admin) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Admin profile retrieved successfully',
        data: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt,
        },
      };
    }
  
    @UseGuards(AdminGuard)
    @Get('dashboard')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get admin dashboard data' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Dashboard data retrieved successfully',
    })
    async getDashboard() {
      // Add your dashboard logic here
      // You can query database for real stats
      return {
        statusCode: HttpStatus.OK,
        message: 'Dashboard data retrieved successfully',
        data: {
          totalUsers: 1000,
          totalActivities: 500,
          totalBonds: 200,
          totalStories: 1500,
          recentActivities: [],
          systemHealth: 'good',
        },
      };
    }
  }