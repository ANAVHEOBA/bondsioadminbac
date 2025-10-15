import { ApiProperty } from '@nestjs/swagger';

export class BondMemberDetailDto {
  @ApiProperty({ description: 'Member ID (UUID)', example: 'user-uuid-1' })
  id: string;

  @ApiProperty({ description: 'Member full name', example: 'John Doe' })
  full_name: string;

  @ApiProperty({ description: 'Member username', example: 'johndoe' })
  user_name: string;

  @ApiProperty({ description: 'Member email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'Member profile image URL', example: 'https://...', nullable: true })
  profile_image: string | null;

  @ApiProperty({ description: 'When the member joined the bond', example: '2024-01-20T14:30:00Z' })
  joined_at: Date;

  @ApiProperty({ description: 'Whether the member is a co-organizer', example: false })
  is_co_organizer: boolean;
}

export class BondMembersResponseDto {
  @ApiProperty({ description: 'Response code', example: 1 })
  code: number;

  @ApiProperty({ description: 'Response message', example: 'Bond members retrieved successfully' })
  message: string;

  @ApiProperty({
    description: 'Bond members data',
    type: 'object',
    properties: {
      members: {
        type: 'array',
        items: { $ref: '#/components/schemas/BondMemberDetailDto' }
      },
      total: { type: 'number', example: 150 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total_pages: { type: 'number', example: 8 }
    }
  })
  data: {
    members: BondMemberDetailDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
