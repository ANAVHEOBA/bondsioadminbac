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
  @ApiProperty({ example: '1b89f704-0157-4b7f-9974-d56de26a4d12', description: 'User ID (UUID)' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'David Nwani', description: 'Full name', required: false })
  full_name?: string;

  @Expose()
  @ApiProperty({ example: 'david@example.com', description: 'Email address' })
  email: string;

  @Exclude()
  password: string;

  @Expose()
  @ApiProperty({ example: 'dave', description: 'Username', required: false })
  user_name?: string;

  @Expose()
  @ApiProperty({ example: '09020971619', description: 'Phone number', required: false })
  phone?: string;

  @Expose()
  @ApiProperty({ example: 'I will take what belongs to ceasar', description: 'User bio', required: false })
  bio?: string;

  @Exclude()
  latitude?: string;

  @Exclude()
  longitude?: string;

  @Expose()
  @ApiProperty({ example: true, description: 'Notification preferences enabled', required: false })
  notification?: boolean;

  @Expose()
  @ApiProperty({ example: 125, description: 'Country ID', required: false })
  country_id?: number;

  @Exclude()
  social_id?: string;

  @Exclude()
  social_type?: string;

  @Expose()
  @ApiProperty({ example: '1990-01-01', description: 'Date of birth (YYYY-MM-DD)', required: false })
  dob?: string;

  @Exclude()
  otp_email?: number;

  @Exclude()
  otp_phone?: string;

  @Expose()
  @ApiProperty({ example: true, description: 'Whether email is verified', required: false })
  email_verified?: boolean;

  @Expose()
  @ApiProperty({ example: true, description: 'Whether phone number is verified', required: false })
  phone_verified?: boolean;

  @Expose()
  @ApiProperty({ example: 'https://res.cloudinary.com/example.png', description: 'Profile image URL', required: false })
  profile_image?: string;

  @Expose()
  @ApiProperty({ example: 'ANDROID', enum: ['ANDROID', 'IOS', 'WEB'], description: 'Device type', required: false })
  device_type?: string;

  @Expose()
  @ApiProperty({ example: 'fcmToken', description: 'Firebase Cloud Messaging token', required: false })
  fcm_token?: string;

  @Expose()
  @ApiProperty({ example: '2025-07-30T20:10:19.000Z', description: 'Account creation date' })
  created_at: Date;

  @Expose()
  @ApiProperty({ example: 'male', description: 'User gender', required: false })
  gender?: string;

  @Expose()
  @ApiProperty({ example: 'user', enum: ['user', 'admin'], description: 'User role', required: false })
  role?: string;

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