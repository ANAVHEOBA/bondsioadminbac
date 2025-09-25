import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SingleMemberDto {
  @ApiProperty({ example: '47cefeb4-19ed-48fe-ad76-027398c10d11' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AddMembersDto {
  /* 1️⃣ single user (legacy) */
  @ApiProperty({
    description: 'Single user ID (legacy)',
    required: false,
    example: '47cefeb4-19ed-48fe-ad76-027398c10d11',
  })
  @IsString()
  @IsNotEmpty()
  userId?: string;

  /* 2️⃣ bulk users (new) */
  @ApiProperty({
    description: 'Array of user IDs to add in one call',
    type: [String],
    required: false,
    example: [
      '47cefeb4-19ed-48fe-ad76-027398c10d11',
      'b4e2c9e1-8d7e-4c6a-9f3b-1a2b3c4d5e6f',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  userIds?: string[];
}