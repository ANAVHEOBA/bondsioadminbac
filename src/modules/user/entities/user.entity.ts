// src/modules/user/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  ManyToOne,
  OneToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

import { Bond } from '../../bonds/entities/bond.entity';
import { Activity } from '../../activity/entities/activity.entity';
import { NotificationPreferences } from './notification-preferences.entity';
import { Country } from '../../country/entities/country.entity';
import { UserInterest } from '../../user-interests/entities/user-interest.entity';

@Entity('users')
export class User {
  /* ------------------------------------------------------------------ */
  /* Basic identity                                                     */
  /* ------------------------------------------------------------------ */
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
  profile_image: string;

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

  /* ------------------------------------------------------------------ */
  /* Relations                                                          */
  /* ------------------------------------------------------------------ */
  @OneToMany(() => Bond, (bond) => bond.creator)
  created_bonds: Bond[];

  @ManyToMany(() => Bond, (bond) => bond.users)
  bonds: Bond[];

  @ManyToMany(() => Bond, (bond) => bond.liked_by)
  liked_bonds: Bond[];

  @ManyToOne(() => Country, { eager: true, nullable: true })
  @JoinColumn({ name: 'country_id' })
  country?: Country;

  @ManyToMany(() => UserInterest)
  @JoinTable({
    name: 'user_interests_mapping',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_interest_id', referencedColumnName: 'id' },
  })
  interests: UserInterest[];

  @ManyToMany(() => Activity)
  @JoinTable({
    name: 'activity_likes',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'activity_id', referencedColumnName: 'id' },
  })
  liked_activities: Activity[];

  @OneToOne(
    () => NotificationPreferences,
    (np) => np.user,
    { cascade: true },
  )
  notification_preferences: NotificationPreferences;

  /* ------------------------------------------------------------------ */
  /* Social graph – self-referencing many-to-many                       */
  /* ------------------------------------------------------------------ */
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'follows',  // ✅ Fixed: Use existing 'follows' table
    joinColumn: { name: 'follower_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'following_id', referencedColumnName: 'id' },
  })
  following: User[];

  @ManyToMany(() => User, (user) => user.following)
  followers: User[];
}