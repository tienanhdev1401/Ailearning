import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Subtitle } from "./subtitle";
import { TopicLessonType } from "../enums/topicLessonType"; 
import { LessonLevel } from "../enums/lessonLevel.enum";

@Entity({ name: "lessons" })
export class Lesson {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "nvarchar", length: 255, nullable: false })
  title!: string;

  @Column({ type: "varchar", length: 500, nullable: false })
  video_url!: string;

  @Column({ type: "varchar", length: 500, nullable: false })
  thumbnail_url!: string;

  @Column({ type: "nvarchar", length: 100, nullable: false })
  topic_type!: TopicLessonType;

  @Column({ type: "int", default: 0 })
  views!: number;

  @Column({ type: "nvarchar", length: 50, nullable: false })
  level!: LessonLevel;

  @OneToMany(() => Subtitle, (subtitle) => subtitle.lesson, { cascade: true })
  subtitles!: Subtitle[];

  @CreateDateColumn()
  startedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
