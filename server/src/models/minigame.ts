import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, TableInheritance, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Activity } from "./activity";
import EType from "../enums/minigameType.enum";

@Entity({ name: "minigames" })
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class MiniGame {
  @PrimaryGeneratedColumn({ name: "minigame_id" })
  id!: number;

  @Column({ type: "varchar", nullable: false })
  type!: EType;

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
}
