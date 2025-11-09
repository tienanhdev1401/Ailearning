// models/minigame.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, TableInheritance, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Activity } from "./activity";
import MiniGameType from "../enums/minigameType.enum";

@Entity({ name: "minigames" })
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class MiniGame {
  @PrimaryGeneratedColumn({ name: "minigame_id" })
  id!: number;

  @Column({ type: "varchar", nullable: false })
  type!: MiniGameType;

  @Column({ type: "text", nullable: false })
  prompt!: string;

  @Column({ type: "json", nullable: true })
  resources?: Record<string, any>;

  @ManyToOne(() => Activity, (activity) => activity.minigames, { onDelete: "CASCADE" })
  activity!: Activity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Constructor 
  constructor(prompt?: string, resources?: Record<string, any>, activity?: Activity, type?: MiniGameType) {
    if (prompt) this.prompt = prompt;
    if (resources) this.resources = resources;
    if (activity) this.activity = activity;
    if (type) this.type = type;
  }
}
