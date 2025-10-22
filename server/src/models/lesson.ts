import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Subtitle } from "./subtitle";

@Entity({ name: "lessons" })
export class Lesson {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  video_url!: string;

  @Column()
  thumbnail_url!: string;

  @OneToMany(() => Subtitle, (subtitle) => subtitle.lesson, { cascade: true })
  subtitles!: Subtitle[];
}
