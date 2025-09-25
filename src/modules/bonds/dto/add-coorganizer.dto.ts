import { IsNotEmpty, IsString } from 'class-validator';

export class AddCoOrganizerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;   // id of the member to promote
}