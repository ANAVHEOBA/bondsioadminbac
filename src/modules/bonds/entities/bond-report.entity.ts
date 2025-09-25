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
  import { Bond } from './bond.entity';
  import { User } from '../../user/entities/user.entity';
  
  export enum ReportReason {
    INAPPROPRIATE_CONTENT = 'inappropriate_content',
    SPAM                = 'spam',
    HARASSMENT          = 'harassment',
    FALSE_INFORMATION   = 'false_information',
    SAFETY_CONCERNS     = 'safety_concerns',
    OTHER               = 'other',
  }
  
  export enum ReportStatus {
    PENDING  = 'pending',
    REVIEWED = 'reviewed',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
  }
  
  @Entity('bond_reports')
  @Index(['bond_id', 'reporter_id'], { unique: true })
  export class BondReport {
    @PrimaryGeneratedColumn('increment')
    id: number;
  
    @Column({ type: 'int' })
    bond_id: number;
  
    @ManyToOne(() => Bond, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bond_id' })
    bond: Bond;
  
    @Column({ type: 'varchar', length: 36 })
    reporter_id: string;
  
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reporter_id' })
    reporter: User;
  
    @Column({ type: 'enum', enum: ReportReason, nullable: false })
    reason: ReportReason;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
    status: ReportStatus;
  
    @Column({ type: 'json', nullable: true })
    metadata: any;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @Column({ type: 'varchar', length: 36, nullable: true })
    reviewed_by: string;
  
    @Column({ type: 'text', nullable: true })
    review_notes: string | null;
  
    @Column({ type: 'datetime', nullable: true })
    reviewed_at: Date;
  }