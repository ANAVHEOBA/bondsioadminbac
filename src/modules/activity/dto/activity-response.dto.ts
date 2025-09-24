import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  user_name: string;

  @ApiProperty({ nullable: true })
  profile_image?: string;
}

@Exclude()
export class ActivityResponseDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty({ nullable: true })
  description?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  location?: string;

  @Expose()
  @ApiProperty({ nullable: true })
  latitude?: number;

  @Expose()
  @ApiProperty({ nullable: true })
  longitude?: number;

  @Expose()
  @ApiProperty()
  start_date: Date;

  @Expose()
  @ApiProperty()
  end_date: Date;

  @Expose()
  @ApiProperty()
  max_participants: number;

  @Expose()
  @ApiProperty()
  request_to_join: boolean;

  @Expose()
  @ApiProperty()
  is_public: boolean;

  @Expose()
  @ApiProperty()
  visibility: string;

  @Expose()
  @ApiProperty()
  post_to_story: boolean;

  @Expose()
  @ApiProperty({ nullable: true })
  cover_image?: string;

  @Expose()
  @ApiProperty()
  likes_count: number;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @Type(() => UserDto)
  creator: UserDto;

  @Expose()
  @Type(() => UserDto)
  co_organizers?: UserDto[];

  @Expose()
  @Type(() => UserDto)
  participants?: UserDto[];

  @Expose()
  @ApiProperty()
  total_participants_count: number;

  @Expose()
  @ApiProperty()
  is_liked: boolean;

  @Expose()
  @ApiProperty()
  is_organiser: boolean;

  @Expose()
  @ApiProperty()
  has_joined: boolean;
}