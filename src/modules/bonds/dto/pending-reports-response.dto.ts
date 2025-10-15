import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PendingReportDto {
  @ApiProperty({ description: 'Report ID', example: 123 })
  id: number;

  @ApiProperty({ description: 'Bond ID', example: 42 })
  bond_id: number;

  @ApiProperty({ description: 'Bond name', example: 'Test Bond' })
  bond_name: string;

  @ApiProperty({ description: 'Reporter user ID', example: 'user-uuid' })
  reporter_id: string;

  @ApiProperty({ description: 'Reporter full name', example: 'Jane Smith' })
  reporter_name: string;

  @ApiProperty({ description: 'Report reason', example: 'inappropriate_content' })
  reason: string;

  @ApiProperty({ description: 'Report description', example: 'Contains offensive material' })
  description: string;

  @ApiProperty({ description: 'Report creation timestamp', example: '2024-10-14T12:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Report status', example: 'pending' })
  status: string;
}

export class PendingReportsQueryDto {
  @ApiProperty({ description: 'Page number', required: false, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Sort field', 
    required: false, 
    enum: ['created_at', 'bond_id'], 
    example: 'created_at',
    default: 'created_at'
  })
  @IsOptional()
  @IsEnum(['created_at', 'bond_id'])
  sort_by?: string = 'created_at';

  @ApiProperty({ 
    description: 'Sort order', 
    required: false, 
    enum: ['ASC', 'DESC'], 
    example: 'DESC',
    default: 'DESC'
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: string = 'DESC';
}

export class PendingReportsResponseDto {
  @ApiProperty({ description: 'Response code', example: 1 })
  code: number;

  @ApiProperty({ description: 'Response message', example: 'Pending reports retrieved successfully' })
  message: string;

  @ApiProperty({
    description: 'Pending reports data',
    type: 'object',
    properties: {
      reports: {
        type: 'array',
        items: { $ref: '#/components/schemas/PendingReportDto' }
      },
      total: { type: 'number', example: 23 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total_pages: { type: 'number', example: 2 }
    }
  })
  data: {
    reports: PendingReportDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
