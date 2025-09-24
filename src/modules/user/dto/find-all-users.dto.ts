import { IsOptional, IsBoolean, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindAllUsersDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (starts from 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'john', description: 'Search term to filter users by name, username, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by email verification status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  email_verified?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter by phone verification status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  phone_verified?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Filter by notification preference' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  notification?: boolean;
}