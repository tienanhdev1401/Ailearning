import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Day } from "./day";
import Skill from "../enums/skill.enum";
import { UserProgress } from "./userProgress";

@Entity({ name: "activities" })
export class Activity {
  @PrimaryGeneratedColumn({ name: "activity_id" })
  id!: number;

  @Column({ type: "varchar",nullable: false,})
  skill!: Skill;

  @Column({ name: "point_of_ac", type: "int", nullable: false, default: 0 })
  pointOfAc!: number;

  @Column({ name: "order", type: "int", nullable: false })
  order!: number;

  @Column({ name: "content", type: "text", nullable: true })
  content?: string;

  @Column({ name: "resources", type: "json", nullable: true })
  resources?: Record<string, any>;

  @ManyToOne(() => Day, (day) => day.activities, { onDelete: "CASCADE" })
  day!: Day;

  @OneToMany(() => UserProgress, (progress) => progress.activity)
  userProgresses!: UserProgress[];

  @CreateDateColumn()
  startedAt!: Date;
    
  @UpdateDateColumn()
  updatedAt!: Date;
  
}
