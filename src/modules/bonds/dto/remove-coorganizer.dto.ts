// src/modules/bonds/dto/remove-coorganizer.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveCoOrganizerDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // ID of the user to be removed as co-organiser
}