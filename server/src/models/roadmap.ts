import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Day } from "./day";
import { RoadmapEnrollment } from "./roadmapEnrollment";

@Entity({ name: "roadmaps" })
export class Roadmap {
  @PrimaryGeneratedColumn({ name: "level_id" })
  id!: number;

  @Column({ name: "level_name", type: "varchar", length: 255, nullable: false })
  levelName!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "overview", type: "text", nullable: true })
  overview!: string | null;

  @OneToMany(() => Day, (day) => day.roadmap)
  days!: Day[];

  @OneToMany(() => RoadmapEnrollment, (enroll) => enroll.roadmap)
  enrollments!: RoadmapEnrollment[];

  @CreateDateColumn()
  startedAt!: Date;
    
  @UpdateDateColumn()
  updatedAt!: Date;

}
