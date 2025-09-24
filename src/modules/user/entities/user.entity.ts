import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Exclude } from 'class-transformer';
  import { Country } from './country.entity';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    full_name: string;
  
    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    user_name: string;
  
    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    email: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    phone: string;
  
    @Column({ type: 'integer', nullable: true })
    otp_phone: number;
  
    @Column({ type: 'integer', nullable: true })
    otp_email: number;
  
    @Column({ type: 'boolean', default: false })
    phone_verified: boolean;
  
    @Column({ type: 'boolean', default: false })
    email_verified: boolean;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    dob: string;
  
    @Column({ type: 'integer', nullable: true })
    country_id: number;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    bio: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    latitude: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    longitude: string;
  
    @Column({ type: 'boolean', default: false })
    notification: boolean;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    device_type: string;
  
    @Exclude()
    @Column({ type: 'varchar', length: 255, nullable: true })
    password: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    fcm_token: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    social_id: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    social_type: string;
  
    @Column({ default: null, type: 'timestamp', nullable: true })
    deleted_at: Date | null;
  
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date | null;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    gender: string;
  
    @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
    role: 'user' | 'admin';
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    profile_image: string;
  
    @ManyToOne(() => Country, { eager: true, nullable: true })
    @JoinColumn({ name: 'country_id' })
    country?: Country;
  }