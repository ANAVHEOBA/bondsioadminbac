import { IsNotEmpty } from 'class-validator';
import { Bond } from 'src/modules/bonds/entities/bond.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_interests')
export class UserInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column({ type: 'varchar', length: 255 })
  interest: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date | null;


 @ManyToMany(() => Bond, bond => bond.userInterests)
  bonds: Bond[]
}
