import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { AiConversation } from "./aiConversation";

@Entity({ name: "ai_evaluations" })
export class AiEvaluation {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(
    () => AiConversation,
    (conversation: AiConversation) => conversation.evaluation,
    {
    onDelete: "CASCADE",
    }
  )
  @JoinColumn()
  conversation!: AiConversation;

  @Column({ type: "float", default: 0 })
  pronunciationScore!: number;

  @Column({ type: "float", default: 0 })
  prosodyScore!: number;

  @Column({ type: "float", default: 0 })
  grammarScore!: number;

  @Column({ type: "float", default: 0 })
  vocabularyScore!: number;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @Column({ type: "longtext", nullable: true })
  rawDetails!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
