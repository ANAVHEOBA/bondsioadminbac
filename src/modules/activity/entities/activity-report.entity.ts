import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from '../../user/entities/user.entity';

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  FALSE_INFORMATION = 'false_information',
  SAFETY_CONCERNS = 'safety_concerns',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

@Entity('activity_reports')
@Index(['activity_id', 'reporter_id'], { unique: true })
export class ActivityReport {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  activity_id: number;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'uuid' })
  reporter_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ 
    type: 'enum', 
    enum: ReportReason,
    nullable: false 
  })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ReportStatus,
    default: ReportStatus.PENDING 
  })
  status: ReportStatus;

  @Column({ type: 'json', nullable: true })
  metadata: any; // For storing additional context like screenshots, links, etc.

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string;

  @Column({ type: 'text', nullable: true }) 
review_notes: string | null;  

  @Column({ type: 'datetime', nullable: true })
  reviewed_at: Date;
}