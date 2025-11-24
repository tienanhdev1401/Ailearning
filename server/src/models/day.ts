import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Roadmap } from "./roadmap";
import { Activity } from "./activity";

@Entity({ name: "days" })
export class Day {
  @PrimaryGeneratedColumn({ name: "day_id" })
  id!: number;

  @Column({ name: "day_number", type: "int", nullable: false })
  dayNumber!: number;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "condition", type: "int", nullable: true })
  condition?: number;

  @ManyToOne(() => Roadmap, (roadmap) => roadmap.days, { onDelete: "CASCADE" })
  roadmap!: Roadmap;

  @OneToMany(() => Activity, (activity) => activity.day)
  activities!: Activity[];

  @CreateDateColumn()
  startedAt!: Date;
    
  @UpdateDateColumn()
  updatedAt!: Date;
}
