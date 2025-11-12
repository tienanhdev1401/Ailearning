import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user";
import { Activity } from "./activity";

@Entity("user_progress")
export class UserProgress {
  @PrimaryGeneratedColumn({ name: "progress_id" })
  id!: number;

  @ManyToOne(() => User, (user) => user.progresses, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Activity, (activity) => activity.userProgresses, { onDelete: "CASCADE" })
  activity!: Activity;

  @Column({ name: "is_completed", type: "boolean", default: false })
  isCompleted!: boolean;

  @Column({ name: "time_spent", type: "int", nullable: true })
  timeSpent?: number;

  @Column({ name: "completed_at", type: "datetime", nullable: true })
  completedAt!: Date | null;
  
  @CreateDateColumn()
  startedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
