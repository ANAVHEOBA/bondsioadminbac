import { IsOptional, IsPositive, IsIn, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum CreatorSortBy {
  ACTIVITY_COUNT = 'activity_count',
  TOTAL_PARTICIPANTS = 'total_participants',
  AVG_PARTICIPANTS = 'avg_participants',
  TOTAL_LIKES = 'total_likes',
  ENGAGEMENT_SCORE = 'engagement_score'
}

export class TopCreatorsQueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    example: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of creators per page',
    example: 10,
    required: false,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsPositive()
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort creators by',
    enum: CreatorSortBy,
    example: CreatorSortBy.ACTIVITY_COUNT,
    required: false,
    default: CreatorSortBy.ACTIVITY_COUNT
  })
  @IsOptional()
  @IsEnum(CreatorSortBy)
  sort_by?: CreatorSortBy = CreatorSortBy.ACTIVITY_COUNT;

  @ApiProperty({
    description: 'Minimum number of activities to be included',
    example: 2,
    required: false,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsPositive()
  min_activities?: number = 1;

  @ApiProperty({
    description: 'Number of days to look back (0 for all time)',
    example: 30,
    required: false,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  days_back?: number = 0;

  @ApiProperty({
    description: 'Include hidden activities in the count',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_hidden?: boolean = false;
}
