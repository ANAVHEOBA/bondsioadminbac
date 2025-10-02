import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReportByReasonDto {
  @ApiProperty({ description: 'Report reason' })
  @Expose()
  reason: string;

  @ApiProperty({ description: 'Number of reports with this reason' })
  @Expose()
  count: number;

  @ApiProperty({ description: 'Percentage of total reports' })
  @Expose()
  percentage: number;
}

export class ReportByStatusDto {
  @ApiProperty({ description: 'Report status' })
  @Expose()
  status: string;

  @ApiProperty({ description: 'Number of reports with this status' })
  @Expose()
  count: number;

  @ApiProperty({ description: 'Percentage of total reports' })
  @Expose()
  percentage: number;
}

export class ReportTrendsDto {
  @ApiProperty({ description: 'Date' })
  @Expose()
  date: string;

  @ApiProperty({ description: 'Number of reports created on this date' })
  @Expose()
  count: number;
}

export class ReportStatsDto {
  @ApiProperty({ description: 'Total number of reports' })
  @Expose()
  total_reports: number;

  @ApiProperty({ description: 'Number of pending reports' })
  @Expose()
  pending_reports: number;

  @ApiProperty({ description: 'Number of reviewed reports' })
  @Expose()
  reviewed_reports: number;

  @ApiProperty({ description: 'Number of resolved reports' })
  @Expose()
  resolved_reports: number;

  @ApiProperty({ description: 'Number of dismissed reports' })
  @Expose()
  dismissed_reports: number;

  @ApiProperty({ description: 'Reports created in the last 24 hours' })
  @Expose()
  reports_last_24h: number;

  @ApiProperty({ description: 'Reports created in the last 7 days' })
  @Expose()
  reports_last_7d: number;

  @ApiProperty({ description: 'Reports created in the last 30 days' })
  @Expose()
  reports_last_30d: number;

  @ApiProperty({ description: 'Average time to resolve reports (in hours)' })
  @Expose()
  avg_resolution_time_hours: number;

  @ApiProperty({ description: 'Reports breakdown by reason', type: [ReportByReasonDto] })
  @Expose()
  reports_by_reason: ReportByReasonDto[];

  @ApiProperty({ description: 'Reports breakdown by status', type: [ReportByStatusDto] })
  @Expose()
  reports_by_status: ReportByStatusDto[];

  @ApiProperty({ description: 'Report trends over the last 30 days', type: [ReportTrendsDto] })
  @Expose()
  report_trends: ReportTrendsDto[];

  @ApiProperty({ description: 'Most reported activity ID' })
  @Expose()
  most_reported_activity_id: number | null;

  @ApiProperty({ description: 'Number of reports for the most reported activity' })
  @Expose()
  most_reported_activity_count: number;

  @ApiProperty({ description: 'Number of unique reporters' })
  @Expose()
  unique_reporters: number;

  @ApiProperty({ description: 'Number of unique reported activities' })
  @Expose()
  unique_reported_activities: number;
}
