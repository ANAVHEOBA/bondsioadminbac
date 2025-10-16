// src/modules/activity/dto/update-report-status.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportStatus } from '../entities/activity-report.entity';

export class UpdateReportStatusFormDto {
  @ApiProperty({ 
    enum: ReportStatus,
    enumName: 'ReportStatus',
    description: 'New status for the report',
    example: ReportStatus.REVIEWED,
    required: true
  })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiProperty({
    description: 'Admin review notes or resolution details (optional)',
    example: 'Reviewed and found violation of community guidelines. Activity has been hidden.',
    maxLength: 1000,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}