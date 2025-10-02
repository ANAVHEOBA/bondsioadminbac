import { ApiProperty } from '@nestjs/swagger';

export class BondStatsDto {
  @ApiProperty({
    description: 'Total number of bonds in the system',
    example: 150
  })
  total_bonds: number;

  @ApiProperty({
    description: 'Number of active (non-hidden) bonds',
    example: 142
  })
  active_bonds: number;

  @ApiProperty({
    description: 'Number of hidden bonds',
    example: 8
  })
  hidden_bonds: number;

  @ApiProperty({
    description: 'Number of public bonds',
    example: 120
  })
  public_bonds: number;

  @ApiProperty({
    description: 'Number of private bonds',
    example: 30
  })
  private_bonds: number;

  @ApiProperty({
    description: 'Total number of members across all bonds',
    example: 2450
  })
  total_members: number;

  @ApiProperty({
    description: 'Average number of members per bond',
    example: 16.33
  })
  average_members_per_bond: number;

  @ApiProperty({
    description: 'Number of bonds created in the last 24 hours',
    example: 5
  })
  bonds_last_24h: number;

  @ApiProperty({
    description: 'Number of bonds created in the last 7 days',
    example: 23
  })
  bonds_last_7d: number;

  @ApiProperty({
    description: 'Number of bonds created in the last 30 days',
    example: 67
  })
  bonds_last_30d: number;

  @ApiProperty({
    description: 'Total number of bond reports',
    example: 12
  })
  total_reports: number;

  @ApiProperty({
    description: 'Number of pending bond reports',
    example: 3
  })
  pending_reports: number;

  @ApiProperty({
    description: 'Number of trending bonds',
    example: 8
  })
  trending_bonds: number;

  @ApiProperty({
    description: 'Total likes across all bonds',
    example: 1250
  })
  total_likes: number;

  @ApiProperty({
    description: 'Average likes per bond',
    example: 8.33
  })
  average_likes_per_bond: number;

  @ApiProperty({
    description: 'Number of bonds with unlimited members',
    example: 45
  })
  unlimited_member_bonds: number;

  @ApiProperty({
    description: 'Number of bonds requiring request to join',
    example: 89
  })
  request_to_join_bonds: number;
}
