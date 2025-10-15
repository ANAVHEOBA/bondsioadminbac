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
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { AdminGuard } from '../admin/guards/admin/admin.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT-auth')
@Controller('user')
@UseGuards(AdminGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: get all users with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Users retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            users: { type: 'array', items: { $ref: '#/components/schemas/UserResponseDto' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
                hasNextPage: { type: 'boolean' },
                hasPreviousPage: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  })
  async findAll(@Query(ValidationPipe) query: FindAllUsersDto) {
    const data = await this.userService.findAll(query);
    return {
      code: 1,
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Admin: get users overview analytics' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'], example: 'daily' })
  @ApiResponse({
    status: 200,
    description: 'Users overview analytics retrieved successfully'
  })
  async getUsersOverview(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const data = await this.userService.getUsersOverview({ period });
    return {
      code: 1,
      message: 'Users overview analytics retrieved successfully',
      data,
    };
  }

  @Get('analytics/demography')
  @ApiOperation({ summary: 'Admin: get users demography analytics' })
  @ApiResponse({
    status: 200,
    description: 'Users demography analytics retrieved successfully'
  })
  async getUsersDemography() {
    const data = await this.userService.getUsersDemography();
    return {
      code: 1,
      message: 'Users demography analytics retrieved successfully',
      data,
    };
  }

  @Get('analytics/verification')
  @ApiOperation({ summary: 'Admin: get email vs phone verification funnel analytics' })
  @ApiResponse({
    status: 200,
    description: 'Verification funnel analytics retrieved successfully'
  })
  async getVerificationFunnel() {
    const data = await this.userService.getVerificationFunnel();
    return {
      code: 1,
      message: 'Verification funnel analytics retrieved successfully',
      data,
    };
  }

  @Get('analytics/total')
  @ApiOperation({ summary: 'Admin: get total number of user accounts' })
  @ApiResponse({
    status: 200,
    description: 'Total users count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Total users count retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 1250 }
          }
        }
      }
    }
  })
  async getTotalUsers() {
    const total = await this.userService.getTotalUsers();
    return {
      code: 1,
      message: 'Total users count retrieved successfully',
      data: { total },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get user by ID with full details' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findOne(id);
    return {
      code: 1,
      message: 'User retrieved successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: permanently delete a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID (UUID)', example: 'user-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User deleted successfully' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      code: 1,
      message: 'User deleted successfully',
    };
  }
}