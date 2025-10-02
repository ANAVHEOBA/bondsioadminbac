import { IsOptional, IsBoolean, IsString, IsArray, IsDateString, IsNumber, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AdvancedSearchBondDto {
  @ApiProperty({ required: false, description: 'Full-text search query across name, description, and city' })
  @IsOptional()
  @IsString()
  q?: string;

  // Flat filter properties for easier query parameter usage
  @ApiProperty({ required: false, description: 'Filter by bond name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Filter by city/location' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Filter by creator name or username' })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ required: false, description: 'Filter by creation date (from)' })
  @IsOptional()
  @IsDateString()
  created_from?: Date;

  @ApiProperty({ required: false, description: 'Filter by creation date (to)' })
  @IsOptional()
  @IsDateString()
  created_to?: Date;

  @ApiProperty({
    required: false,
    description: "Filter by visibility",
    enum: ['public', 'private'],
  })
  @IsOptional()
  @IsEnum(['public', 'private'])
  visibility?: 'public' | 'private';

  @ApiProperty({ required: false, description: 'Filter by minimum member count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_members?: number;

  @ApiProperty({ required: false, description: 'Filter by maximum member count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_members?: number;

  @ApiProperty({ required: false, description: 'Filter by minimum likes count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_likes?: number;

  @ApiProperty({ required: false, description: 'Filter by maximum likes count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_likes?: number;

  @ApiProperty({ required: false, description: 'Filter by minimum view count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_views?: number;

  @ApiProperty({ required: false, description: 'Filter by hidden status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_hidden?: boolean;

  @ApiProperty({ required: false, description: 'Filter by trending status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_trending?: boolean;

  @ApiProperty({ required: false, description: 'Filter by reported bonds' })
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

  @ApiProperty({ required: false, description: 'Filter by post to story setting' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  post_to_story?: boolean;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by interest categories (comma-separated IDs)',
    example: '1,2,3',
    type: String
  })
  @IsOptional()
  @IsString()
  interest_ids?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Sort by field', 
    enum: ['created_at', 'updated_at', 'name', 'city', 'member_count', 'likes_count', 'view_count'],
    default: 'created_at'
  })
  @IsOptional()
  @IsEnum(['created_at', 'updated_at', 'name', 'city', 'member_count', 'likes_count', 'view_count'])
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'city' | 'member_count' | 'likes_count' | 'view_count';

  @ApiProperty({ 
    required: false, 
    description: 'Sort order', 
    enum: ['ASC', 'DESC'],
    default: 'DESC'
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

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

export class BondSearchResponseDto {
  @ApiProperty({ description: 'Array of bonds matching search criteria' })
  bonds: any[]; // Will be enriched bond objects

  @ApiProperty({ description: 'Total number of bonds matching the search' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ description: 'Search query information' })
  search_info: {
    query?: string;
    filters_applied: string[];
    sort_by: string;
    sort_order: string;
  };
}
