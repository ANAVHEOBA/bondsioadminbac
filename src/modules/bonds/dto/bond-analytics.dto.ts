import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BondLocationAnalyticsDto {
  @ApiProperty({ description: 'City/location name' })
  @Expose()
  city: string;

  @ApiProperty({ description: 'Number of bonds in this location' })
  @Expose()
  bond_count: number;

  @ApiProperty({ description: 'Total members across bonds in this location' })
  @Expose()
  total_members: number;

  @ApiProperty({ description: 'Average members per bond in this location' })
  @Expose()
  avg_members: number;
}

export class BondEngagementMetricsDto {
  @ApiProperty({ description: 'Average likes per bond' })
  @Expose()
  avg_likes_per_bond: number;

  @ApiProperty({ description: 'Average members per bond' })
  @Expose()
  avg_members_per_bond: number;

  @ApiProperty({ description: 'Bond activity rate (bonds with recent activities)' })
  @Expose()
  activity_rate: number;

  @ApiProperty({ description: 'Average view count per bond' })
  @Expose()
  avg_view_count: number;

  @ApiProperty({ description: 'Most popular bond visibility type' })
  @Expose()
  most_popular_visibility: string;

  @ApiProperty({ description: 'Report rate (reports per 100 bonds)' })
  @Expose()
  report_rate: number;

  @ApiProperty({ description: 'Percentage of bonds requiring join approval' })
  @Expose()
  request_to_join_rate: number;

  @ApiProperty({ description: 'Percentage of bonds with unlimited members' })
  @Expose()
  unlimited_members_rate: number;
}

export class BondCreatorAnalyticsDto {
  @ApiProperty({ description: 'Creator user ID' })
  @Expose()
  creator_id: string;

  @ApiProperty({ description: 'Creator full name' })
  @Expose()
  creator_name: string;

  @ApiProperty({ description: 'Number of bonds created' })
  @Expose()
  bond_count: number;

  @ApiProperty({ description: 'Total members across all their bonds' })
  @Expose()
  total_members: number;

  @ApiProperty({ description: 'Average members per bond' })
  @Expose()
  avg_members: number;

  @ApiProperty({ description: 'Total likes received across all bonds' })
  @Expose()
  total_likes: number;

  @ApiProperty({ description: 'Total views across all bonds' })
  @Expose()
  total_views: number;
}

export class BondInterestAnalyticsDto {
  @ApiProperty({ description: 'Interest name' })
  @Expose()
  interest: string;

  @ApiProperty({ description: 'Number of bonds with this interest' })
  @Expose()
  bond_count: number;

  @ApiProperty({ description: 'Total members in bonds with this interest' })
  @Expose()
  total_members: number;

  @ApiProperty({ description: 'Average members per bond for this interest' })
  @Expose()
  avg_members: number;
}

export class BondGrowthMetricsDto {
  @ApiProperty({ description: 'Average member growth rate per bond' })
  @Expose()
  avg_member_growth_rate: number;

  @ApiProperty({ description: 'Bonds created in last 7 days' })
  @Expose()
  new_bonds_7d: number;

  @ApiProperty({ description: 'Bonds created in last 30 days' })
  @Expose()
  new_bonds_30d: number;

  @ApiProperty({ description: 'New members joined in last 7 days' })
  @Expose()
  new_members_7d: number;

  @ApiProperty({ description: 'New members joined in last 30 days' })
  @Expose()
  new_members_30d: number;
}

export class BondAnalyticsDto {
  @ApiProperty({ description: 'Popular locations analytics', type: [BondLocationAnalyticsDto] })
  @Expose()
  popular_locations: BondLocationAnalyticsDto[];

  @ApiProperty({ description: 'Engagement metrics', type: BondEngagementMetricsDto })
  @Expose()
  engagement_metrics: BondEngagementMetricsDto;

  @ApiProperty({ description: 'Top bond creators', type: [BondCreatorAnalyticsDto] })
  @Expose()
  top_creators: BondCreatorAnalyticsDto[];

  @ApiProperty({ description: 'Popular interests in bonds', type: [BondInterestAnalyticsDto] })
  @Expose()
  popular_interests: BondInterestAnalyticsDto[];

  @ApiProperty({ description: 'Bond growth metrics', type: BondGrowthMetricsDto })
  @Expose()
  growth_metrics: BondGrowthMetricsDto;

  @ApiProperty({ description: 'Bond creation trends over the last 30 days' })
  @Expose()
  bond_trends: { date: string; count: number }[];

  @ApiProperty({ description: 'Member join trends over the last 30 days' })
  @Expose()
  member_trends: { date: string; count: number }[];
}
