import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { AiConversation } from "./aiConversation";
import AI_MESSAGE_ROLE from "../enums/aiMessageRole.enum";

@Entity({ name: "ai_messages" })
@Index(["conversation"])
export class AiMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(
    () => AiConversation,
    (conversation: AiConversation) => conversation.messages,
    {
    nullable: false,
    onDelete: "CASCADE",
    }
  )
  conversation!: AiConversation;

  @Column({ type: "enum", enum: AI_MESSAGE_ROLE })
  role!: AI_MESSAGE_ROLE;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "text", nullable: true })
  transcript!: string | null;

  @Column({ type: "float", nullable: true })
  durationSeconds!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  audioPath!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
