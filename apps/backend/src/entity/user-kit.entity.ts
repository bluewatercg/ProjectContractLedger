import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Kit } from './kit.entity';

@Entity('user_kits')
export class UserKit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    kit_id: number;

    @Column({ type: 'boolean', default: false })
    is_default: boolean;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Kit, kit => kit.userKits, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'kit_id' })
    kit: Kit;
}
