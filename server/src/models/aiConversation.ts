import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user";
import { AiScenario } from "./aiScenario";
import AI_CONVERSATION_MODE from "../enums/aiConversationMode.enum";
import AI_CONVERSATION_STATUS from "../enums/aiConversationStatus.enum";
import { AiMessage } from "./aiMessage";
import { AiEvaluation } from "./aiEvaluation";

@Entity({ name: "ai_conversations" })
export class AiConversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user: User) => user.aiConversations, {
    nullable: false,
  })
  user!: User;

  @ManyToOne(
    () => AiScenario,
    (scenario: AiScenario) => scenario.conversations,
    {
    nullable: true,
    }
  )
  scenario!: AiScenario | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  customTitle!: string | null;

  @Column({ type: "text", nullable: true })
  customPrompt!: string | null;

  @Column({ type: "enum", enum: AI_CONVERSATION_MODE, default: AI_CONVERSATION_MODE.TEXT })
  mode!: AI_CONVERSATION_MODE;

  @Column({ type: "enum", enum: AI_CONVERSATION_STATUS, default: AI_CONVERSATION_STATUS.ACTIVE })
  status!: AI_CONVERSATION_STATUS;

  @Column({ type: "varchar", length: 255, nullable: true })
  audioPath!: string | null;

  @Column({ type: "datetime", nullable: true })
  endedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(
    () => AiMessage,
    (message: AiMessage) => message.conversation,
    {
    cascade: true,
    }
  )
  messages!: AiMessage[];

  @OneToOne(
    () => AiEvaluation,
    (evaluation: AiEvaluation) => evaluation.conversation
  )
  @JoinColumn()
  evaluation!: AiEvaluation | null;
}
