import { IsOptional, IsBoolean, IsString, IsArray, IsDateString, IsNumber, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class AdvancedSearchActivityDto {
  @ApiProperty({ required: false, description: 'Full-text search query across title, description, and location' })
  @IsOptional()
  @IsString()
  q?: string;

  // Flat filter properties for easier query parameter usage
  @ApiProperty({ required: false, description: 'Filter by activity title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Filter by creator name or username' })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ required: false, description: 'Filter by start date (from)' })
  @IsOptional()
  @IsDateString()
  start_date_from?: Date;

  @ApiProperty({ required: false, description: 'Filter by start date (to)' })
  @IsOptional()
  @IsDateString()
  start_date_to?: Date;

  @ApiProperty({ required: false, description: 'Filter by end date (from)' })
  @IsOptional()
  @IsDateString()
  end_date_from?: Date;

  @ApiProperty({ required: false, description: 'Filter by end date (to)' })
  @IsOptional()
  @IsDateString()
  end_date_to?: Date;

  @ApiProperty({
    required: false,
    description: "Filter by visibility",
    enum: ['public', 'private', 'bond_only'],
  })
  @IsOptional()
  @IsEnum(['public', 'private', 'bond_only'])
  visibility?: 'public' | 'private' | 'bond_only';

  @ApiProperty({ required: false, description: 'Filter by minimum participants count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_participants?: number;

  @ApiProperty({ required: false, description: 'Filter by maximum participants count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_participants?: number;

  @ApiProperty({ required: false, description: 'Filter by minimum likes count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_likes?: number;

  @ApiProperty({ required: false, description: 'Filter by activity status', enum: ['upcoming', 'ongoing', 'completed', 'expired'] })
  @IsOptional()
  @IsEnum(['upcoming', 'ongoing', 'completed', 'expired'])
  status?: 'upcoming' | 'ongoing' | 'completed' | 'expired';

  @ApiProperty({ required: false, description: 'Filter by hidden status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_hidden?: boolean;

  @ApiProperty({ required: false, description: 'Filter by reported activities' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  has_reports?: boolean;

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
    description: 'Filter by bond IDs (comma-separated)',
    example: '1,2,3',
    type: String
  })
  @IsOptional()
  @IsString()
  bond_ids?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Sort by field', 
    enum: ['start_date', 'created_at', 'likes_count', 'participants_count', 'title', 'location'],
    default: 'start_date'
  })
  @IsOptional()
  @IsEnum(['start_date', 'created_at', 'likes_count', 'participants_count', 'title', 'location'])
  sort_by?: 'start_date' | 'created_at' | 'likes_count' | 'participants_count' | 'title' | 'location';

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
