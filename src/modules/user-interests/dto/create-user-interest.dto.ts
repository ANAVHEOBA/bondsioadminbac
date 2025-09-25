import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserInterestDto {
  @ApiProperty({
    description: 'Name of the user interest category',
    example: 'Technology',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  interest: string;

  @ApiProperty({
    description: 'Whether the interest is active',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
