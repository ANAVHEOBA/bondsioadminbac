import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Countries')
@ApiBearerAuth('JWT-auth')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @ApiOperation({ 
    summary: 'Create Country', 
    description: 'Create a new country record' 
  })
  @ApiBody({ type: CreateCountryDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Country created successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Country created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'United States' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() createCountryDto: CreateCountryDto) {
    return this.countryService.create(createCountryDto);
  }

  @ApiOperation({ 
    summary: 'Get All Countries', 
    description: 'Retrieve all countries (public endpoint)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Countries retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Countries fetched successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'United States' }
            }
          }
        }
      }
    }
  })
  
  @Get()
  findAll() {
    return this.countryService.findAll();
  }

  @ApiOperation({ 
    summary: 'Get Country by ID', 
    description: 'Retrieve a specific country by its ID' 
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Country retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Country retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'United States' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.countryService.findOne(+id);
  }

  @ApiOperation({ 
    summary: 'Update Country', 
    description: 'Update an existing country\'s information' 
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 1 })
  @ApiBody({ type: UpdateCountryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Country updated successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Country updated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Updated Country Name' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCountryDto: UpdateCountryDto) {
    return this.countryService.update(+id, updateCountryDto);
  }

  @ApiOperation({ 
    summary: 'Delete Country', 
    description: 'Delete a country record permanently' 
  })
  @ApiParam({ name: 'id', description: 'Country ID', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Country deleted successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 1 },
        message: { type: 'string', example: 'Country deleted successfully' },
        data: { type: 'null', example: null }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countryService.remove(+id);
  }
}
