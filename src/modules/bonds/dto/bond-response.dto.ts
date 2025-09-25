import { ApiProperty } from '@nestjs/swagger';
import { Activity } from '../../activity/entities/activity.entity';
import { UserInterest } from '../../user-interests/entities/user-interest.entity';

export class CreatorResponseDto {
  @ApiProperty({ description: 'Creator ID' })
  id: string;

  @ApiProperty({ description: 'Creator full name' })
  full_name: string | null;

  @ApiProperty({ description: 'Creator username' })
  user_name: string | null;

  @ApiProperty({ description: 'Creator profile image' })
  profile_image: string | null;
}

export class BondMemberResponseDto {
  @ApiProperty({ description: 'Member ID' })
  id: string;

  @ApiProperty({ description: 'Member full name' })
  full_name: string | null;

  @ApiProperty({ description: 'Member username' })
  user_name: string | null;

  @ApiProperty({ description: 'Member email' })
  email: string;

  @ApiProperty({ description: 'Member profile image' })
  profile_image: string | null;

  @ApiProperty({ description: 'When the member joined the bond' })
  joined_at: Date;
}

export class BondResponseDto {
  @ApiProperty({ description: 'Bond ID' })
  id: number;
  @ApiProperty({ description: 'Bond name' })
  name: string;
  @ApiProperty({ description: 'Bond city' })
  city: string;
  @ApiProperty({ description: 'Bond latitude' })
  latitude: string;
  @ApiProperty({ description: 'Bond longitude' })
  longitude: string;
  @ApiProperty({ description: 'Bond description' })
  description: string;
  @ApiProperty({ description: 'Maximum number of members' })
  max_members: number;
  @ApiProperty({ description: 'Whether bond has unlimited members' })
  is_unlimited_members: boolean;
  @ApiProperty({ description: 'Whether bond requires request to join' })
  request_to_join: boolean;
  @ApiProperty({ description: 'Whether bond is public' })
  is_public: boolean;
  @ApiProperty({ description: 'Whether bond posts to story' })
  post_to_story: boolean;
  @ApiProperty({ description: 'Bond banner image URL' })
  banner: string;
  @ApiProperty({ description: 'Bond rules' })
  rules: string;
  @ApiProperty({ description: 'Whether bond is trending' })
  is_trending: boolean;
  // Removed: is_happening_now, happening_now_start, happening_now_end
  @ApiProperty({ description: 'View count' })
  view_count: number;
  @ApiProperty({ description: 'Member count' })
  member_count: number;
  @ApiProperty({ description: 'Likes count' })
  likes_count: number;
  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;
  @ApiProperty({ description: 'Whether the authenticated user has joined this bond' })
  hasJoined: boolean;
  @ApiProperty({ description: 'Last 5 members who joined the bond', type: [BondMemberResponseDto] })
  lastMembers: BondMemberResponseDto[];
  @ApiProperty({ description: 'Bond creator', type: CreatorResponseDto, nullable: true })
  creator: CreatorResponseDto | null;
  @ApiProperty({ description: 'User interests associated with this bond', type: [UserInterest] })
  userInterests?: UserInterest[];
  @ApiProperty({ description: 'Last 3 recent activities on this bond', type: [Activity] })
  recentActivities?: Activity[];
  @ApiProperty({ description: 'True if the requesting user is one of the co-organizers' })
  isCoOrganizer?: boolean;
  
}

export class BondListResponseDto {
  @ApiProperty({ description: 'Response code' })
  code: number;
  @ApiProperty({ description: 'Response message' })
  message: string;
  @ApiProperty({ description: 'Bonds data', type: [BondResponseDto] })
  data: BondResponseDto[];
  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class BondDetailResponseDto {
  @ApiProperty({ description: 'Response code' })
  code: number;
  @ApiProperty({ description: 'Response message' })
  message: string;
  @ApiProperty({ description: 'Bond data', type: BondResponseDto, nullable: true })
  data: BondResponseDto | null;
}

export class LastMembersResponseDto {
  @ApiProperty({ description: 'Response code' })
  code: number;
  @ApiProperty({ description: 'Response message' })
  message: string;
  @ApiProperty({ description: 'Last members data', type: [BondMemberResponseDto] })
  data: BondMemberResponseDto[];
} 