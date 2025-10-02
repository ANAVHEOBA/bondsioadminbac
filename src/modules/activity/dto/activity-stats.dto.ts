import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ActivityStatsDto {
  @ApiProperty({ description: 'Total number of activities' })
  @Expose()
  total_activities: number;

  @ApiProperty({ description: 'Number of active (non-hidden) activities' })
  @Expose()
  active_activities: number;

  @ApiProperty({ description: 'Number of hidden activities' })
  @Expose()
  hidden_activities: number;

  @ApiProperty({ description: 'Number of public activities' })
  @Expose()
  public_activities: number;

  @ApiProperty({ description: 'Number of private activities' })
  @Expose()
  private_activities: number;

  @ApiProperty({ description: 'Number of bond-only activities' })
  @Expose()
  bond_only_activities: number;

  @ApiProperty({ description: 'Total number of participants across all activities' })
  @Expose()
  total_participants: number;

  @ApiProperty({ description: 'Average participants per activity' })
  @Expose()
  average_participants_per_activity: number;

  @ApiProperty({ description: 'Number of activities created in the last 24 hours' })
  @Expose()
  activities_last_24h: number;

  @ApiProperty({ description: 'Number of activities created in the last 7 days' })
  @Expose()
  activities_last_7d: number;

  @ApiProperty({ description: 'Number of activities created in the last 30 days' })
  @Expose()
  activities_last_30d: number;

  @ApiProperty({ description: 'Total number of activity reports' })
  @Expose()
  total_reports: number;

  @ApiProperty({ description: 'Number of pending reports' })
  @Expose()
  pending_reports: number;
}
