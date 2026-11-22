
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tenants')
@Index('IDX_tenants_name_location', { synchronize: false })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'restaurant_name',
    type: 'varchar',
    length: 150,
  })
  restaurantName!: string;

  @Column({
    name: 'database_name',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  databaseName!: string;

  @Column({
    name: 'location',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  location!: string | null;

  @Column({
    name: 'cover_image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  coverImageUrl!: string | null;

  @Column({
    name: 'cover_image_public_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  coverImagePublicId!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
