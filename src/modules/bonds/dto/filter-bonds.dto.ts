import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { PaginationDto } from '../../user/dto/pagination.dto';
import { Transform, Type } from 'class-transformer';

export enum BondFilterType {
  TRENDING = 'trending',
  ALL = 'all'
}

export enum MyBondsFilter {
  INCLUDE = 'include',
  EXCLUDE = 'exclude'
}

export class FilterBondsDto {
  @ApiProperty({
    description: 'Search query to filter bonds by name or description',
    required: false
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Filter type: trending, happening_now, or all',
    enum: BondFilterType,
    required: false
  })
  @IsOptional()
  @IsEnum(BondFilterType)
  filterType?: BondFilterType;

  @ApiProperty({
    description: 'Filter bonds by a comma-separated list of interest UUIDs.',
    required: false,
    type: String,
    example: '0918a32a-7c9e-4c2d-9e2a-9e3d9b4b0033,0918a32a-7c9e-4c2d-9e2a-9e3d9b4b0034',
  })
  @IsOptional()
  @Transform(({ value }) => (value ? (typeof value === 'string' ? value.split(',') : value) : undefined))
  @IsArray()
  @IsUUID('all', { each: true, message: 'Each interest ID must be a valid UUID.' })
  interestIds?: string[];

  @ApiProperty({
    description: 'Filter to include or exclude bonds created by the authenticated user',
    enum: MyBondsFilter,
    required: false,
    example: 'exclude'
  })
  @IsOptional()
  @IsEnum(MyBondsFilter)
  myBondsFilter?: MyBondsFilter;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    minimum: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetBondMembersDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term to filter members by name or email',
    required: false,
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;
} 