import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Generic prompt registry for any AI-generative feature in the system.
 *
 * `feature` namespaces the prompt by domain (ai_chat, grammar_check, translator, ...).
 * `key` is the identifier inside the feature (opening, followUp, evaluation,
 *      or per-scenario override e.g. "opening:job_interview").
 *
 * The `(feature, key)` pair is unique. Adding a new AI feature does NOT require
 * any change to PromptService — it only registers a new namespace via DB rows.
 */
@Entity({ name: "ai_prompts" })
@Index("uq_ai_prompts_feature_key", ["feature", "key"], { unique: true })
export class AiPrompt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  feature!: string;

  @Column({ type: "varchar", length: 128 })
  key!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "longtext" })
  template!: string;

  // JSON array of variable names this template accepts. Stored as text for
  // portability across DB engines.
  @Column({ type: "text", nullable: true })
  variables!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  provider!: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  model!: string | null;

  @Column({ type: "float", nullable: true })
  temperature!: number | null;

  @Column({ type: "float", nullable: true })
  topP!: number | null;

  @Column({ type: "int", nullable: true })
  maxOutputTokens!: number | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
