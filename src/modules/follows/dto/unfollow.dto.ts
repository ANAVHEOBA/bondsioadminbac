import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnfollowDto {
  @ApiProperty({
    description: 'UUID of the user to unfollow',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true
  })
  @IsNotEmpty()
  @IsUUID()
  following_id: string;
}
