import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user";
import { SubscriptionPackage } from "./subscriptionPackage";
import { TRANSACTION_STATUS } from "../enums/transactionStatus.enum";

@Entity({ name: "transactions" })
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "int", nullable: false })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int", nullable: false })
  packageId!: number;

  @ManyToOne(() => SubscriptionPackage)
  @JoinColumn({ name: "packageId" })
  package!: SubscriptionPackage;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount!: number;

  @Column({
    type: "enum",
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PENDING,
  })
  status!: TRANSACTION_STATUS;

  @Column({ type: "varchar", length: 100, nullable: true, comment: "VNPAY transaction reference" })
  vnpayTxnRef!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
