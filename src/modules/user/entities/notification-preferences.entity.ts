import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @Column({ type: 'boolean', default: true })
  story_notifications: boolean;

  @Column({ type: 'boolean', default: true })
  suggestion_notifications: boolean;

  @Column({ type: 'boolean', default: true })
  reminder_notifications: boolean;

  @Column({ type: 'boolean', default: true })
  chat_notifications: boolean;

  @Column({ type: 'boolean', default: true })
  all_notifications: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
} 