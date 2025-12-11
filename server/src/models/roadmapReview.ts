import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
} from "typeorm";
import { Roadmap } from "./roadmap";
import { User } from "./user";

@Entity({ name: "roadmap_reviews" })
@Unique(["roadmap", "user"])
export class RoadmapReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Roadmap, (roadmap) => roadmap.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roadmap_id" })
  roadmap!: Roadmap;

  @ManyToOne(() => User, (user) => user.roadmapReviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "tinyint", nullable: false })
  rating!: number;

  @Column({ type: "text", nullable: false })
  comment!: string;

  @CreateDateColumn({ name: "created_at"})
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
