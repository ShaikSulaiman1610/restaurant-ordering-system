
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

@Entity('payments')
@Index('IDX_payments_order_id', ['orderId'])
@Index(
  'UQ_payments_transaction_reference',
  ['transactionReference'],
  { unique: true },
)
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  orderId!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'varchar',
    length: 150,
  })
  transactionReference!: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  failureReason!: string | null;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
