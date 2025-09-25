// dto/update-activity-form.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateActivityFormDto {
  @ApiPropertyOptional({ description: 'Title of the activity', example: 'Beach Cleanup Day' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description', example: 'Join us for...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Miami Beach' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: '25.7617' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  latitude?: string;

  @ApiPropertyOptional({ description: 'Longitude', example: '-80.1918' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  longitude?: string;

  @ApiPropertyOptional({ description: 'Start date-time', example: '2025-01-11 16:00:00' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date-time', example: '2025-01-11 17:00:00' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Max participants', example: '10' })
  @IsOptional()
  @IsString()
  max_participants?: string;

  @ApiPropertyOptional({ description: 'Require request to join', example: 'true' })
  @IsOptional()
  @IsString()
  request_to_join?: string;

  @ApiPropertyOptional({ description: 'Visibility', example: 'public', enum: ['public', 'private', 'bond_only'] })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({ description: 'Post to stories', example: 'false' })
  @IsOptional()
  @IsString()
  post_to_story?: string;

  @ApiPropertyOptional({ description: 'Comma-separated co-organizer IDs', example: '1,2,3' })
  @IsOptional()
  co_organizer_ids?: any;

  @ApiPropertyOptional({ description: 'Comma-separated invited participant IDs', example: '1,2,3' })
  @IsOptional()
  invited_participant_ids?: any;

  @ApiPropertyOptional({ description: 'Comma-separated interest IDs', example: '1,2,3' })
  @IsOptional()
  interest_ids?: any;

  @ApiPropertyOptional({ description: 'Comma-separated bond IDs', example: '1,2,3' })
  @IsOptional()
  bond_ids?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Cover image' })
  @IsOptional()
  cover_image?: any;
}