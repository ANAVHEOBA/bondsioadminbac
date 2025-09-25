// src/modules/activity/dto/update-report-status.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportStatus } from '../entities/activity-report.entity';

export class UpdateReportStatusFormDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}