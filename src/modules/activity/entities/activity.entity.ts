// src/modules/activity/entities/activity.entity.ts
import { UserInterest } from 'src/modules/user-interests/entities/user-interest.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Bond } from 'src/modules/bonds/entities/bond.entity';
// Add Missing Import
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm'; // Added ManyToOne, JoinColumn

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 255 })
  latitude: string;

  @Column({ type: 'varchar', length: 255 })
  longitude: string;

  @Column({ type: 'datetime' })
  start_date: Date;

  @Column({ type: 'datetime' })
  end_date: Date;

  @Column({ type: 'int', nullable: true, default: 10 })
  max_participants: number;

  @Column({ type: 'boolean', default: true })
  request_to_join: boolean;

  @Column({ type: 'boolean', default: true })
  is_public: boolean;

  @Column({ type: 'boolean', default: false })
  post_to_story: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string;

  @Column({ type: 'int', default: 0 })
  likes_count: number;


@Column({ type: 'enum', enum: ['public', 'private', 'bond_only'], default: 'public' })
visibility: 'public' | 'private' | 'bond_only';


@Column({ type: 'timestamp', nullable: true })
hidden_at: Date | null;

// helper getter
get is_hidden(): boolean {
  return this.hidden_at !== null;
}



  // --- Add Creator Relationship ---
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator?: User;

  @Column({ type: 'uuid', nullable: true }) // Adjust type if User.id is not UUID
  creator_id?: string;
  // --- End Add Creator Relationship ---

  @ManyToMany(() => User)
  @JoinTable({
    name: 'activity_likes',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  liked_by: User[];

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'activity_co_organizers',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  co_organizers: User[];

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'activity_participants',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  participants: User[];

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'activity_invited_participants',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  invited_participants: User[];

  @ManyToMany(() => UserInterest, { cascade: true })
  @JoinTable({
    name: 'activity_interests',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_interest_id',
      referencedColumnName: 'id',
    },
  })
  interests: UserInterest[];

  @ManyToMany(() => Bond)
  @JoinTable({
    name: 'activity_bonds',
    joinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'bond_id',
      referencedColumnName: 'id',
    },
  })
  bonds: Bond[];


  get total_participants_count(): number {
    let count = 0;
    
    // Count creator (always a participant)
    if (this.creator) {
      count++;
    }
    
    // Count co-organizers (they are also participants)
    if (this.co_organizers) {
      count += this.co_organizers.length;
    }
    
    // Count additional participants (excluding duplicates)
    if (this.participants) {
      const participantIds = new Set();
      
      // Add creator ID if exists
      if (this.creator) {
        participantIds.add(this.creator.id);
      }
      
      // Add co-organizer IDs
      if (this.co_organizers) {
        this.co_organizers.forEach(co => participantIds.add(co.id));
      }
      
      // Count participants that aren't already counted
      this.participants.forEach(participant => {
        if (!participantIds.has(participant.id)) {
          participantIds.add(participant.id);
          count++;
        }
      });
    }
    
    return count;
  }

  
}