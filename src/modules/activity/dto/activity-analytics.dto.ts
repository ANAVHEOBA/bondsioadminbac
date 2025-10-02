import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LocationAnalyticsDto {
  @ApiProperty({ description: 'Location name' })
  @Expose()
  location: string;

  @ApiProperty({ description: 'Number of activities at this location' })
  @Expose()
  activity_count: number;

  @ApiProperty({ description: 'Total participants across activities at this location' })
  @Expose()
  total_participants: number;

  @ApiProperty({ description: 'Average participants per activity at this location' })
  @Expose()
  avg_participants: number;
}

export class PeakTimeAnalyticsDto {
  @ApiProperty({ description: 'Hour of day (0-23)' })
  @Expose()
  hour: number;

  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)' })
  @Expose()
  day_of_week: number;

  @ApiProperty({ description: 'Number of activities starting at this time' })
  @Expose()
  activity_count: number;

  @ApiProperty({ description: 'Total participants for activities starting at this time' })
  @Expose()
  total_participants: number;
}

export class EngagementMetricsDto {
  @ApiProperty({ description: 'Average likes per activity' })
  @Expose()
  avg_likes_per_activity: number;

  @ApiProperty({ description: 'Average participants per activity' })
  @Expose()
  avg_participants_per_activity: number;

  @ApiProperty({ description: 'Activity completion rate (activities that ended vs total)' })
  @Expose()
  completion_rate: number;

  @ApiProperty({ description: 'Average activity duration in hours' })
  @Expose()
  avg_duration_hours: number;

  @ApiProperty({ description: 'Most popular activity visibility type' })
  @Expose()
  most_popular_visibility: string;

  @ApiProperty({ description: 'Report rate (reports per 100 activities)' })
  @Expose()
  report_rate: number;
}

export class CreatorAnalyticsDto {
  @ApiProperty({ description: 'Creator user ID' })
  @Expose()
  creator_id: string;

  @ApiProperty({ description: 'Creator full name' })
  @Expose()
  creator_name: string;

  @ApiProperty({ description: 'Number of activities created' })
  @Expose()
  activity_count: number;

  @ApiProperty({ description: 'Total participants across all their activities' })
  @Expose()
  total_participants: number;

  @ApiProperty({ description: 'Average participants per activity' })
  @Expose()
  avg_participants: number;

  @ApiProperty({ description: 'Total likes received across all activities' })
  @Expose()
  total_likes: number;
}

export class ActivityAnalyticsDto {
  @ApiProperty({ description: 'Popular locations analytics', type: [LocationAnalyticsDto] })
  @Expose()
  popular_locations: LocationAnalyticsDto[];

  @ApiProperty({ description: 'Peak times analytics', type: [PeakTimeAnalyticsDto] })
  @Expose()
  peak_times: PeakTimeAnalyticsDto[];

  @ApiProperty({ description: 'Engagement metrics', type: EngagementMetricsDto })
  @Expose()
  engagement_metrics: EngagementMetricsDto;

  @ApiProperty({ description: 'Top activity creators', type: [CreatorAnalyticsDto] })
  @Expose()
  top_creators: CreatorAnalyticsDto[];

  @ApiProperty({ description: 'Activity trends over the last 30 days' })
  @Expose()
  activity_trends: { date: string; count: number }[];

  @ApiProperty({ description: 'Participation trends over the last 30 days' })
  @Expose()
  participation_trends: { date: string; count: number }[];
}
