// src/modules/activity/dto/query-recommended.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryRecommendedDto {
  @ApiProperty({ required: false, description: 'Page number (starts from 1)', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Number of items per page', example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ 
    required: false, 
    description: 'Filter by user interest IDs (comma-separated UUIDs)', 
    example: '0269b73c-a473-4efb-9992-6dd22c438f50,06d95652-fbd9-4a65-9d57-8bbb1d82b57b',
    type: String
  })
  @IsOptional()
  @IsString()
  interest_ids?: string;
}