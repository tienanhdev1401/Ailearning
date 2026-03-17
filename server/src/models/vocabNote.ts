import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user";

@Entity({ name: "vocab_notes" })
@Index(["userId", "term"], { unique: true })
export class VocabNote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 255 })
  term!: string;

  @Column({ type: "text" })
  definition!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  source!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
