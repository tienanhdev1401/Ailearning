import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import USER_ROLE from "../enums/userRole.enum";
import AUTH_PROVIDER from "../enums/authProvider.enum";

import { RoadmapEnrollment } from "./roadmapEnrollment";
import { UserProgress } from "./userProgress";
import { UserConfirm } from "./userconfirm";
import { AiScenario } from "./aiScenario";
import { AiConversation } from "./aiConversation";
import { SupportConversation } from "./supportConversation";
import { SupportMessage } from "./supportMessage";
import { RoadmapReview } from "./roadmapReview";
import USER_GENDER from "../enums/userGender.enum";
import USER_STATUS from "../enums/userStatus.enum";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  email!: string;

  @Column({ type: "varchar", nullable: true })
  password!: string | null;

  @Column({ type: "varchar", nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: "date", nullable: true })
  birthday!: Date | null;

  @Column({
    type: "enum",
    enum: USER_GENDER,
    nullable: true,
  })
  gender!: USER_GENDER | null;

  @Column({
    type: "enum",
    enum: USER_STATUS,
    default: USER_STATUS.ACTIVE,
  })
  status!: USER_STATUS;

  @Column({
    type: "enum",
    enum: USER_ROLE,
    default: USER_ROLE.USER,
  })
  role!: USER_ROLE;

  @Column({
    type: "enum",
    enum: AUTH_PROVIDER,
    default: AUTH_PROVIDER.LOCAL,
  })
  authProvider!: AUTH_PROVIDER;

  // ✅ Custom validation: bắt buộc password nếu authProvider là local
  validatePasswordRequired() {
    if (this.authProvider === AUTH_PROVIDER.LOCAL && !this.password) {
      throw new Error(
        "Password là bắt buộc khi đăng nhập bằng phương thức local"
      );
    }
  };

  // Một người có thể tham gia nhiều roadmap
  @OneToMany(() => RoadmapEnrollment, (enroll) => enroll.user)
  enrollments!: RoadmapEnrollment[];

  // Một người có thể có nhiều tiến độ hoạt động
  @OneToMany(() => UserProgress, (progress) => progress.user)
  progresses!: UserProgress[];

  @OneToOne(() => UserConfirm, (confirm) => confirm.user)
  confirm!: UserConfirm;

  @OneToMany(() => AiScenario, (scenario) => scenario.createdBy)
  customScenarios!: AiScenario[];

  @OneToMany(() => AiConversation, (conversation) => conversation.user)
  aiConversations!: AiConversation[];

  @OneToMany(() => SupportConversation, (conversation) => conversation.customer)
  supportConversations!: SupportConversation[];

  @OneToMany(() => SupportConversation, (conversation) => conversation.assignee)
  assignedSupportConversations!: SupportConversation[];

  @OneToMany(() => SupportMessage, (message) => message.sender)
  supportMessages!: SupportMessage[];

  @OneToMany(() => RoadmapReview, (review) => review.user)
  roadmapReviews!: RoadmapReview[];


  @CreateDateColumn()
  startedAt!: Date;
  
  @UpdateDateColumn()
  updatedAt!: Date;
}
