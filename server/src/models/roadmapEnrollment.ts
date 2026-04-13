import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user";
import { Roadmap } from "./roadmap";

@Entity("roadmap_enrollments")
export class RoadmapEnrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.enrollments, { onDelete: "CASCADE" })
  user!: User;

  @ManyToOne(() => Roadmap, (roadmap) => roadmap.enrollments, { onDelete: "CASCADE" })
  roadmap!: Roadmap;

  @Column({ default: "active" })
  status!: "active" | "paused" | "completed" | "dropped";

  @Column({ default: 0 })
  streak!: number;

  @Column({ type: "datetime", nullable: true })
  lastActivityAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  dailyChallengeCompletedAt!: Date | null;

  @Column({ type: "datetime", nullable: false })
  started_at!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
