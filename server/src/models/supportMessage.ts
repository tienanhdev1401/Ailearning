import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { SupportConversation } from "./supportConversation";
import { User } from "./user";
import SUPPORT_MESSAGE_AUTHOR from "../enums/supportMessageAuthor.enum";

@Entity({ name: "support_messages" })
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SupportConversation, (conversation) => conversation.messages, {
    nullable: false,
    onDelete: "CASCADE",
  })
  conversation!: SupportConversation;

  @ManyToOne(() => User, (user) => user.supportMessages, {
    nullable: true,
    onDelete: "SET NULL",
  })
  sender!: User | null;

  @Column({
    type: "enum",
    enum: SUPPORT_MESSAGE_AUTHOR,
    default: SUPPORT_MESSAGE_AUTHOR.USER,
  })
  senderRole!: SUPPORT_MESSAGE_AUTHOR;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
