import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveMemberDto {
  @ApiProperty({
    description: 'User ID (UUID) of the person to remove from the bond',
    example: '47cefeb4-19ed-48fe-ad76-027398c10d11',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}