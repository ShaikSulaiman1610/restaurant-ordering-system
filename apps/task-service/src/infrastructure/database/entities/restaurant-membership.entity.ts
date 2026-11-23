
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RestaurantRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

@Entity('restaurant_memberships')
export class RestaurantMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @Column({
    name: 'restaurant_id',
    type: 'uuid',
  })
  restaurantId!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  role!: RestaurantRole;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;
}
