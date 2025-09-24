import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToMany,
    ManyToOne,
    JoinTable,
    OneToMany,
  } from 'typeorm';
  import { User } from '../../user/entities/user.entity';
  import { ActivityReport } from './activity-report.entity';
  
  @Entity('activities')
  export class Activity {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    title: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ nullable: true })
    location: string;
  
    @Column({ type: 'double', nullable: true })
    latitude: number;
  
    @Column({ type: 'double', nullable: true })
    longitude: number;
  
    @Column({ type: 'timestamp' })
    start_date: Date;
  
    @Column({ type: 'timestamp' })
    end_date: Date;
  
    @Column({ type: 'int', default: 10 })
    max_participants: number;
  
    @Column({ type: 'boolean', default: true })
    request_to_join: boolean;
  
    @Column({ type: 'boolean', default: false })
    is_public: boolean;
  
    @Column({ type: 'enum', enum: ['public', 'private', 'bond_only'], default: 'public' })
    visibility: string;
  
    @Column({ type: 'boolean', default: false })
    post_to_story: boolean;
  
    @Column({ nullable: true })
    cover_image: string;
  
    @Column({ type: 'int', default: 0 })
    likes_count: number;
  
    @Column({ type: 'timestamp', nullable: true })
    hidden_at: Date | null;
  
    @Column()
    creator_id: string;
  
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    creator: User;
  
    @ManyToMany(() => User, { eager: true })
    @JoinTable({ name: 'activity_co_organizers' })
    co_organizers: User[];
  
    @ManyToMany(() => User, { eager: true })
    @JoinTable({ name: 'activity_participants' })
    participants: User[];
  
    @ManyToMany(() => User, { eager: true })
    @JoinTable({ name: 'activity_likes' })
    liked_by: User[];
  
    @OneToMany(() => ActivityReport, report => report.activity)
    reports: ActivityReport[];
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date | null;
  }