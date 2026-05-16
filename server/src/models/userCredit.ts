import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user";

@Entity({ name: "user_credits" })
export class UserCredit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", nullable: false })
  userId!: number;

  @OneToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "int", default: 10, comment: "Current available AI conversation credits" })
  aiConversationCredits!: number;

  @Column({ type: "int", default: 10, comment: "Total limit for AI conversation credits" })
  totalAiConversationCredits!: number;

  @Column({ type: "int", default: 5, comment: "Current available grammar checker credits" })
  grammarCheckerCredits!: number;

  @Column({ type: "int", default: 5, comment: "Total limit for grammar checker credits" })
  totalGrammarCheckerCredits!: number;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP", comment: "Last time credits were reset" })
  lastCreditReset!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
