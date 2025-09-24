import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CountryDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'Country ID' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'United States', description: 'Country name' })
  name: string;
}

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  full_name?: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  user_name?: string;

  @Expose()
  phone?: string;

  @Expose()
  bio?: string;

  @Exclude()
  latitude?: string;

  @Exclude()
  longitude?: string;

  @Expose()
  notification?: boolean;

  @Expose()
  country_id?: number;

  @Exclude()
  social_id?: string;

  @Exclude()
  social_type?: string;

  @Expose()
  dob?: string;

  @Exclude()
  otp_email?: number;

  @Exclude()
  otp_phone?: string;

  @Expose()
  email_verified?: boolean;

  @Expose()
  profile_image?: string;

  @Expose()
  device_type?: string;

  @Expose()
  fcm_token?: string;

  @Expose()
  created_at: Date;

  @Expose()
  @ApiProperty({ example: 10, description: 'Number of users following this user', required: false })
  followers_count?: number;

  @Expose()
  @ApiProperty({ example: 5, description: 'Number of users this user is following', required: false })
  following_count?: number;

  @Expose()
  @ApiProperty({ example: 7, description: 'Number of bonds the user is part of', required: false })
  bonds_count?: number;

  @Expose()
  @ApiProperty({ example: 12, description: 'Number of activities the user is participating in', required: false })
  activities_count?: number;

  @Expose()
  @Type(() => CountryDto)
  @ApiProperty({ type: CountryDto, required: false })
  country?: CountryDto;

  @Expose()
  @ApiProperty({ example: true, description: 'Whether the current user is following this user' })
  is_following?: boolean;
}