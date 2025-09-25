import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserInterestsService } from './user-interests.service';
import { CreateUserInterestDto } from './dto/create-user-interest.dto';
import { UpdateUserInterestDto } from './dto/update-user-interest.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('User Interests')
@ApiBearerAuth('JWT-auth')
@Controller('user-interests')
export class UserInterestsController {
  constructor(private readonly userInterestsService: UserInterestsService) {}

  @ApiOperation({ 
    summary: 'Create User Interest', 
    description: 'Create a new user interest category' 
  })
  @ApiBody({ type: CreateUserInterestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User interest created successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User interest created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'interest-uuid-1' },
            interest: { type: 'string', example: 'Technology' },
            is_active: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() createUserInterestDto: CreateUserInterestDto) {
    return this.userInterestsService.create(createUserInterestDto);
  }

  @ApiOperation({ 
    summary: 'Get All User Interests', 
    description: 'Retrieve all user interest categories' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User interests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User interests retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'interest-uuid-1' },
              interest: { type: 'string', example: 'Technology' },
              is_active: { type: 'boolean', example: true },
              created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll() {
    return this.userInterestsService.findAll();
  }

  @ApiOperation({ 
    summary: 'Get User Interest by ID', 
    description: 'Retrieve a specific user interest by its ID' 
  })
  @ApiParam({ name: 'id', description: 'User Interest UUID', example: 'interest-uuid-1' })
  @ApiResponse({ 
    status: 200, 
    description: 'User interest retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User interest retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'interest-uuid-1' },
            interest: { type: 'string', example: 'Technology' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User interest not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userInterestsService.findOne(id);
  }

  @ApiOperation({ 
    summary: 'Update User Interest', 
    description: 'Update an existing user interest\'s information' 
  })
  @ApiParam({ name: 'id', description: 'User Interest UUID', example: 'interest-uuid-1' })
  @ApiBody({ type: UpdateUserInterestDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User interest updated successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User interest updated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'interest-uuid-1' },
            interest: { type: 'string', example: 'Updated Technology' },
            is_active: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User interest not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserInterestDto: UpdateUserInterestDto) {
    return this.userInterestsService.update(id, updateUserInterestDto);
  }

  @ApiOperation({ 
    summary: 'Delete User Interest', 
    description: 'Delete a user interest category permanently' 
  })
  @ApiParam({ name: 'id', description: 'User Interest UUID', example: 'interest-uuid-1' })
  @ApiResponse({ 
    status: 200, 
    description: 'User interest deleted successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'User interest deleted successfully' },
        data: { type: 'null', example: null }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User interest not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userInterestsService.remove(id);
  }
}
