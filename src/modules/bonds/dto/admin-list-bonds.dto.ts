import { IsOptional, IsBoolean, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum AdminBondSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  NAME = 'name',
  CITY = 'city',
  MEMBER_COUNT = 'member_count',
  LIKES_COUNT = 'likes_count',
  VIEW_COUNT = 'view_count',
}

export enum AdminBondSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class AdminListBondsDto {
  @ApiProperty({ required: false, description: 'Search query across bond name, description, and city' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, description: 'Filter by bond name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Filter by creator name or username' })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({
    required: false,
    description: "Filter by visibility",
    enum: ['public', 'private'],
  })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: 'public' | 'private';

  @ApiProperty({ required: false, description: 'Filter by trending status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_trending?: boolean;

  @ApiProperty({ required: false, description: 'Filter by hidden status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_hidden?: boolean;

  @ApiProperty({ required: false, description: 'Filter bonds with reports' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  has_reports?: boolean;

  @ApiProperty({ required: false, description: 'Filter by unlimited members setting' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_unlimited_members?: boolean;

  @ApiProperty({ required: false, description: 'Filter by request to join setting' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  request_to_join?: boolean;

  @ApiProperty({ required: false, description: 'Minimum member count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_members?: number;

  @ApiProperty({ required: false, description: 'Maximum member count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_members?: number;

  @ApiProperty({ 
    required: false, 
    description: 'Sort by field', 
    enum: AdminBondSortBy,
    default: AdminBondSortBy.CREATED_AT
  })
  @IsOptional()
  @IsEnum(AdminBondSortBy)
  sort_by?: AdminBondSortBy;

  @ApiProperty({ 
    required: false, 
    description: 'Sort order', 
    enum: AdminBondSortOrder,
    default: AdminBondSortOrder.DESC
  })
  @IsOptional()
  @IsEnum(AdminBondSortOrder)
  sort_order?: AdminBondSortOrder;

  @ApiProperty({ required: false, description: 'Page number (starts from 1)', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, description: 'Number of items per page', example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class AdminListBondsResponseDto {
  @ApiProperty({ description: 'Array of bonds' })
  bonds: any[];

  @ApiProperty({ description: 'Total number of bonds' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ description: 'Applied filters information' })
  filters_info: {
    applied_filters: string[];
    sort_by: string;
    sort_order: string;
  };
}
