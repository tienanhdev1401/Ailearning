import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import USER_ROLE from "../enums/userRole.enum";
import AUTH_PROVIDER from "../enums/authProvider.enum";

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
  }
}
