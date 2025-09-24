import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Activity } from './activity.entity';
  
  export enum ReportReason {
    SPAM = 'spam',
    INAPPROPRIATE = 'inappropriate',
    HARASSMENT = 'harassment',
    MISINFORMATION = 'misinformation',
    OTHER = 'other',
  }
  
  export enum ReportStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
  }
  
  @Entity('activity_reports')
  export class ActivityReport {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    activity_id: number;
  
    @Column()
    reporter_id: string;
  
    @Column({ type: 'enum', enum: ReportReason })
    reason: ReportReason;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any> | null;
  
    @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
    status: ReportStatus;
  
    @Column({ nullable: true })
    review_notes: string;
  
    @Column({ nullable: true })
    reviewed_by: string;
  
    @Column({ type: 'timestamp', nullable: true })
    reviewed_at: Date | null;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @ManyToOne(() => Activity, activity => activity.reports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activity_id' })
    activity: Activity;
  }