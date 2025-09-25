// src/modules/activity/dto/activity-members.dto.ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ActivityMemberDto {
  @Expose() id: string;
  @Expose() fullName: string;
  @Expose() userName?: string;
  @Expose() avatarUrl?: string;
  @Expose() role: 'owner' | 'co-organizer' | 'participant';
}