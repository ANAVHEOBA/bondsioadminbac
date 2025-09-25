import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({
    description: 'Name of the country',
    example: 'United States',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
