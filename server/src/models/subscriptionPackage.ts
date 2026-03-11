import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { PACKAGE_TYPE } from "../enums/packageType.enum";

@Entity({ name: "subscription_packages" })
export class SubscriptionPackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: PACKAGE_TYPE
  })
  type!: PACKAGE_TYPE;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  price!: number;

  @Column({ type: "int", nullable: true, comment: "Duration in days. Null means permanent unlock." })
  durationInDays!: number | null;

  @Column({ type: "int", nullable: true, comment: "Target ID (e.g., Roadmap ID) if the type requires it." })
  targetId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
