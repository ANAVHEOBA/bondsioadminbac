import { IsOptional, IsPositive, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BondCreatorSortBy {
  BOND_COUNT = 'bond_count',
  TOTAL_MEMBERS = 'total_members',
  AVG_MEMBERS = 'avg_members',
  TOTAL_LIKES = 'total_likes',
  TOTAL_VIEWS = 'total_views',
  ENGAGEMENT_SCORE = 'engagement_score'
}

export class TopBondCreatorsQueryDto {
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
    enum: BondCreatorSortBy,
    example: BondCreatorSortBy.BOND_COUNT,
    required: false,
    default: BondCreatorSortBy.BOND_COUNT
  })
  @IsOptional()
  @IsEnum(BondCreatorSortBy)
  sort_by?: BondCreatorSortBy = BondCreatorSortBy.BOND_COUNT;

  @ApiProperty({
    description: 'Minimum number of bonds to be included',
    example: 2,
    required: false,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsPositive()
  min_bonds?: number = 1;

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
    description: 'Include hidden bonds in the count',
    example: false,
    required: false,
    default: false
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_hidden?: boolean = false;
}
