import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Lesson } from "./lesson";

@Entity({ name: "subtitles" })
export class Subtitle {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  start_time!: string;

  @Column()
  end_time!: string;

  @Column({ type: "text" })
  full_text!: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.subtitles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "lesson_id" })
  lesson!: Lesson;

  @CreateDateColumn()
  startedAt!: Date;
    
  @UpdateDateColumn()
  updatedAt!: Date;
}
