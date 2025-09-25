import { UserInterest } from 'src/modules/user-interests/entities/user-interest.entity'
import { User } from 'src/modules/user/entities/user.entity'
import { Activity } from 'src/modules/activity/entities/activity.entity'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'

@Entity('bonds')
export class Bond {
  @PrimaryGeneratedColumn('increment')
  id: number

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'varchar', length: 255 })
  city: string

  @Column({ type: 'varchar', length: 255 })
  latitude: string

  @Column({ type: 'varchar', length: 255 })
  longitude: string

  @Column({ type: 'text' })
  description: string

  @Column({ type: 'int', nullable: true })
  max_members: number

  @Column({ type: 'boolean' })
  is_unlimited_members: boolean

  @Column({ type: 'boolean' })
  request_to_join: boolean

  @Column({ type: 'boolean' })
  is_public: boolean

  @Column({ type: 'boolean' })
  post_to_story: boolean

  @Column({ type: 'varchar', length: 255 })
  banner: string

  @Column({ type: 'text', nullable: true })
  rules: string

  @Column({ type: 'boolean', default: false })
  is_trending: boolean

  @Column({ type: 'int', default: 0 })
  view_count: number

  @Column({ type: 'int', default: 0 })
  member_count: number

  @Column({ type: 'int', default: 0 })
  likes_count: number

  @ManyToMany(() => User, user => user.liked_bonds, { cascade: true })
  @JoinTable({
    name: 'bonds_likes',
    joinColumn: {
      name: 'bond_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  liked_by: User[]

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @ManyToOne(() => User, user => user.created_bonds)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({
    name: 'bonds_co_organizers',
    joinColumn: {
      name: 'bond_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  co_organizers: User[]

  @ManyToMany(() => User, user => user.bonds, { cascade: true })
  @JoinTable({
    name: 'bonds_users',
    joinColumn: {
      name: 'bond_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  users: User[]

 
@ManyToMany(() => UserInterest, userInterest => userInterest.bonds, { cascade: true })
@JoinTable({
  name: 'bonds_user_interests',
  joinColumn: { name: 'bond_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'user_interest_id', referencedColumnName: 'id' },
})
userInterests: UserInterest[];  

  @ManyToMany(() => Activity, activity => activity.bonds, { cascade: true })
  @JoinTable({
    name: 'activity_bonds',
    joinColumn: {
      name: 'bond_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'activity_id',
      referencedColumnName: 'id',
    },
  })
  activities: Activity[]
}
