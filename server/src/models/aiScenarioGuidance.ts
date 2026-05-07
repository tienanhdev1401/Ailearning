import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * Structured "guidance" record describing the AI's role for a chat scenario.
 *
 * Identified by `scenarioKey` (e.g. job_interview, ask_directions, custom).
 * Exactly one row should be marked `isDefault = true` and is used as the
 * fallback when no specific scenarioKey matches.
 *
 * The `keywords` column (JSON-encoded string array) drives keyword-based
 * resolution from a scenario title/prompt to the corresponding scenarioKey,
 * so admins can extend matching without code changes.
 */
@Entity({ name: "ai_scenario_guidance" })
@Index("uq_ai_scenario_guidance_key", ["scenarioKey"], { unique: true })
export class AiScenarioGuidance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 64 })
  scenarioKey!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  // JSON array of keywords for resolution. Stored as text.
  @Column({ type: "text", nullable: true })
  keywords!: string | null;

  @Column({ type: "text" })
  persona!: string;

  @Column({ type: "text" })
  tone!: string;

  @Column({ type: "text" })
  focus!: string;

  @Column({ type: "text" })
  opening!: string;

  @Column({ type: "text" })
  progression!: string;

  @Column({ type: "text" })
  closing!: string;

  @Column({ type: "int", default: 6 })
  maxUserTurns!: number;

  @Column({ type: "text", nullable: true })
  fallbackOpening!: string | null;

  // JSON array of fallback follow-up strings.
  @Column({ type: "text", nullable: true })
  fallbackFollowUps!: string | null;

  @Column({ type: "boolean", default: false })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
