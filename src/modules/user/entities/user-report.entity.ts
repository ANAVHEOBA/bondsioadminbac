import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum UserReportReason {
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  FAKE_ACCOUNT = 'fake_account',
  IMPERSONATION = 'impersonation',
  SCAM = 'scam',
  SAFETY_CONCERNS = 'safety_concerns',
  OTHER = 'other',
}

export enum UserReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('user_reports')
@Index(['reported_user_id', 'reporter_id'], { unique: true })
@Index(['status'])
@Index(['created_at'])
export class UserReport {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 36 })
  reported_user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_user_id' })
  reported_user: User;

  @Column({ type: 'varchar', length: 36 })
  reporter_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: UserReportStatus,
    default: UserReportStatus.PENDING,
  })
  status: UserReportStatus;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewed_by: string;

  @Column({ type: 'text', nullable: true })
  review_notes: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
