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
import SUPPORT_CONVERSATION_STATUS from "../enums/supportConversationStatus.enum";
import { SupportMessage } from "./supportMessage";

@Entity({ name: "support_conversations" })
export class SupportConversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.supportConversations, {
    nullable: false,
    onDelete: "CASCADE",
  })
  customer!: User;

  @ManyToOne(() => User, (user) => user.assignedSupportConversations, {
    nullable: true,
    onDelete: "SET NULL",
  })
  assignee!: User | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  subject!: string | null;

  @Column({
    type: "enum",
    enum: SUPPORT_CONVERSATION_STATUS,
    default: SUPPORT_CONVERSATION_STATUS.OPEN,
  })
  status!: SUPPORT_CONVERSATION_STATUS;

  @Column({ type: "datetime", nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  lastMessageAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => SupportMessage, (message) => message.conversation, {
    cascade: true,
  })
  messages!: SupportMessage[];
}
