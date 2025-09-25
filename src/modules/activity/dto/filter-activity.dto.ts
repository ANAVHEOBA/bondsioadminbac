import { IsOptional, IsBoolean, IsString, IsArray, IsDateString, IsNumber, Min, Max, IsNumberString } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class FilterActivityDto {
  @ApiProperty({ required: false, description: 'Filter by activity title' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ required: false, description: 'Filter by location' })
  @IsOptional()
  @IsString()
  location?: string

  @ApiProperty({ required: false, description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  start_date?: Date

  @ApiProperty({ required: false, description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  end_date?: Date

  @ApiProperty({ required: false, description: 'Filter by public/private status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_public?: boolean

  @ApiProperty({ required: false, description: 'Get trending activities (most participants)' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  trending?: boolean

  @ApiProperty({ required: false, description: 'Get currently happening activities' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  happening_now?: boolean

  @ApiProperty({ 
    required: false, 
    description: 'Filter by interest categories (comma-separated IDs)',
    example: '1,2,3',
    type: String // ✅ plain string
  })
  @IsOptional()
  @IsString()
  interest_ids?: string

  @ApiProperty({ required: false, description: 'Search query across title and description' })
  @IsOptional()
  @IsString()
  query?: string

  @ApiProperty({ required: false, description: 'Page number (starts from 1)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number

  @ApiProperty({ required: false, description: 'Number of items per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number
}