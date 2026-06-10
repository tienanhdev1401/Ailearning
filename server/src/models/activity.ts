import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm";
import { Day } from "./day";
import ActivityType from "../enums/activityType.enum";
import { UserProgress } from "./userProgress";
import { MiniGame } from "./minigame";

@Entity({ name: "activities" })
export class Activity {
  @PrimaryGeneratedColumn({ name: "activity_id" })
  id!: number;

  @Column({ type: "enum", enum: ActivityType, nullable: false })
  type!: ActivityType;


  @Column({ name: "order", type: "int", nullable: false })
  order!: number;

  @Column({ name: "title", type: "text", nullable: true })
  title?: string;

  @ManyToOne(() => Day, (day) => day.activities, { onDelete: "CASCADE" })
  day!: Day;

  @OneToMany(() => MiniGame, (minigame) => minigame.activity, { cascade: true })
  minigames!: MiniGame[];

  @OneToMany(() => UserProgress, (progress) => progress.activity)
  userProgresses!: UserProgress[];

  @CreateDateColumn()
  startedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

}
