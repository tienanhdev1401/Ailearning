import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Unique } from "typeorm";
import { User } from "./user";
import { Message } from "./message";

@Entity("conversations")
@Unique(["student"])
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.studentConversations)
  student!: User;

  @ManyToOne(() => User, (user) => user.staffConversations)
  staff!: User;

  @OneToMany(() => Message, (msg) => msg.conversation)
  messages!: Message[];
}
