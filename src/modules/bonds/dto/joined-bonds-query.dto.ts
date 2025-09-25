import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinedBondsQueryDto {
  @ApiProperty({ 
    required: false, 
    description: 'Page number (starts from 1)', 
    example: 1, 
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    required: false, 
    description: 'Number of items per page', 
    example: 20, 
    minimum: 1, 
    maximum: 100 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    required: false, 
    description: 'Include bonds created by the current user', 
    example: false,
    default: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  include_created?: boolean = false;

  @ApiProperty({ 
    required: false, 
    description: 'Search bonds by name or description', 
    example: 'Tech Enthusiasts',
  })
  @IsOptional()
  @IsString()
  search?: string;
} 