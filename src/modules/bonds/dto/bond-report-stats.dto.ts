import { ApiProperty } from '@nestjs/swagger';

export class MostReportedBondDto {
  @ApiProperty({ description: 'Bond ID', example: 42 })
  bond_id: number;

  @ApiProperty({ description: 'Bond name', example: 'Controversial Bond' })
  name: string;

  @ApiProperty({ description: 'Number of reports', example: 12 })
  report_count: number;
}

export class BondReportStatsDto {
  @ApiProperty({ description: 'Total number of reports', example: 125 })
  total_reports: number;

  @ApiProperty({ description: 'Number of pending reports', example: 23 })
  pending_reports: number;

  @ApiProperty({ description: 'Number of reviewed reports', example: 87 })
  reviewed_reports: number;

  @ApiProperty({ description: 'Number of resolved reports', example: 10 })
  resolved_reports: number;

  @ApiProperty({ description: 'Number of dismissed reports', example: 5 })
  dismissed_reports: number;

  @ApiProperty({ description: 'Reports in last 24 hours', example: 5 })
  reports_last_24h: number;

  @ApiProperty({ description: 'Reports in last 7 days', example: 18 })
  reports_last_7d: number;

  @ApiProperty({ description: 'Reports in last 30 days', example: 45 })
  reports_last_30d: number;

  @ApiProperty({ description: 'Most reported bond', type: MostReportedBondDto, nullable: true })
  most_reported_bond: MostReportedBondDto | null;

  @ApiProperty({ description: 'Most common report reason', example: 'spam' })
  most_common_reason: string;
}

export class BondReportStatsResponseDto {
  @ApiProperty({ description: 'Response code', example: 1 })
  code: number;

  @ApiProperty({ description: 'Response message', example: 'Report statistics retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Report statistics data', type: BondReportStatsDto })
  data: BondReportStatsDto;
}
