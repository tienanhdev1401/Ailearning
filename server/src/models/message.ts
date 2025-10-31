import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Conversation } from "./conversation";
import { User } from "./user";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Conversation, (conv) => conv.messages)
  conversation!: Conversation;

  @ManyToOne(() => User)
  sender!: User;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
