// src/modules/activity/dto/activity-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class CreatorDto {
  @Expose() id: string;
  @Expose() full_name?: string;
  @Expose() user_name?: string;
  @Expose() profile_image?: string;
}

@Exclude()
export class UserDto {
  @Expose() id: string;
  @Expose() full_name?: string;
  @Expose() user_name?: string;
  @Expose() profile_image?: string;
}

@Exclude()
export class BondDto {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() city: string;
  @Expose() description: string;
  @Expose() banner: string;
  @Expose() member_count: number;
  @Expose() likes_count: number;
  @Expose() is_public: boolean;
  @Expose() is_trending: boolean;
}

@Exclude()
export class InterestDto {
  @Expose() id: string;
  @Expose() interest: string;
  @Expose() is_active: boolean;
  @Expose() created_at: Date;
}

@Exclude()
export class ActivityResponseDto {
  /* copy every field you want to expose */
  @Expose() id: number;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() location: string;
  @Expose() latitude: string;
  @Expose() longitude: string;
  @Expose() start_date: Date;
  @Expose() end_date: Date;
  @Expose() max_participants: number;
  @Expose() request_to_join: boolean;
  @Expose() is_public: boolean;
  @Expose() post_to_story: boolean;
  @Expose() cover_image?: string;
  @Expose() likes_count: number;
  @Expose() creator_id?: string;
  @Expose() visibility: string;

  /* relations - only include if they have meaningful data */
  @Expose() @Type(() => UserDto) co_organizers?: UserDto[];
  @Expose() @Type(() => UserDto) participants?: UserDto[];
  @Expose() @Type(() => InterestDto) interests: InterestDto[];
  @Expose() @Type(() => BondDto) bonds?: BondDto[];
  
  // Direct field for total participants count
  @Expose() total_participants_count?: number;

  @Expose() @Type(() => UserDto) liked_by?: UserDto[];
  @Expose() @Type(() => UserDto) invited_participants?: UserDto[];

@Expose()
@Type(() => CreatorDto)
creator: CreatorDto;

  @Expose() is_organiser: boolean;
  @Expose() is_liked: boolean;
  @Expose() has_joined: boolean;
}