import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user";
import { AiConversation } from "./aiConversation";

@Entity({ name: "ai_scenarios" })
export class AiScenario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  prompt!: string;

  @Column({ type: "varchar", length: 16, default: "en" })
  language!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  difficulty!: string | null;

  @Column({ type: "boolean", default: false })
  isCustom!: boolean;

  @ManyToOne(() => User, (user) => user.customScenarios, { nullable: true })
  createdBy!: User | null;

  @OneToMany(
    () => AiConversation,
    (conversation: AiConversation) => conversation.scenario
  )
  conversations!: AiConversation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
