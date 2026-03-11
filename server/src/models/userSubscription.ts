import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user";
import { SubscriptionPackage } from "./subscriptionPackage";

@Entity({ name: "user_subscriptions" })
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @Column({ type: "datetime", nullable: false })
  startDate!: Date;

  @Column({ type: "datetime", nullable: true, comment: "Null means permanent" })
  endDate!: Date | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
