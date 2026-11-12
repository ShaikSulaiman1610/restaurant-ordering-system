
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_name', type: 'varchar', length: 150 })
  restaurantName: string;

  @Column({ name: 'database_name', type: 'varchar', length: 100, unique: true })
  databaseName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
