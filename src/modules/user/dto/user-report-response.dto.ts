import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserReportUserDto {
  @Expose()
  @ApiProperty({ example: '85254985-6395-4667-ba60-22fa4edf940e' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @Expose()
  @ApiProperty({ example: 'johndoe' })
  user_name: string;

  @Expose()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: 'https://example.com/profile.jpg', nullable: true })
  profile_image: string;
}

export class UserReportResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: '85254985-6395-4667-ba60-22fa4edf940e' })
  reported_user_id: string;

  @Expose()
  @ApiProperty({ example: '9fa6e3b0-504a-48ab-9642-0b742055bdb3' })
  reporter_id: string;

  @Expose()
  @ApiProperty({ example: 'harassment' })
  reason: string;

  @Expose()
  @ApiProperty({ example: 'Inappropriate messages in chat', nullable: true })
  description: string;

  @Expose()
  @ApiProperty({ example: 'pending', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] })
  status: string;

  @Expose()
  @ApiProperty({ example: { source: 'mobile_app' }, nullable: true })
  metadata: any;

  @Expose()
  @ApiProperty({ example: '2025-10-27T18:03:55.000Z' })
  created_at: Date;

  @Expose()
  @ApiProperty({ example: '2025-10-27T18:03:55.000Z' })
  updated_at: Date;

  @Expose()
  @ApiProperty({ example: 'admin-uuid', nullable: true })
  reviewed_by: string;

  @Expose()
  @ApiProperty({ example: 'Investigated and resolved', nullable: true })
  review_notes: string;

  @Expose()
  @ApiProperty({ example: '2025-10-27T18:03:55.000Z', nullable: true })
  reviewed_at: Date;

  @Expose()
  @Type(() => UserReportUserDto)
  @ApiProperty({ type: UserReportUserDto })
  reported_user: UserReportUserDto;

  @Expose()
  @Type(() => UserReportUserDto)
  @ApiProperty({ type: UserReportUserDto })
  reporter: UserReportUserDto;
}

export class UserReportsListResponseDto {
  @ApiProperty({ type: [UserReportResponseDto] })
  reports: UserReportResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  total_pages: number;
}
