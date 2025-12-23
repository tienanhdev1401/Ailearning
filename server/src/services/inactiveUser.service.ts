import transporter from "../utils/mailTransporter";
import { AppDataSource } from "../config/database";
import { User } from "../models/user";
import { UserProgress } from "../models/userProgress";
import USER_ROLE from "../enums/userRole.enum";

export class InactiveUserService {
  private userRepo = AppDataSource.getRepository(User);
  private progressRepo = AppDataSource.getRepository(UserProgress);

  async checkInactiveUsers() {
    console.log("Kiểm tra người dùng không hoạt động (7 ngày)...");

    const users = await this.userRepo.find({
      where: { role: USER_ROLE.USER },
    });

    const now = new Date();

    for (const user of users) {
      const lastProgress = await this.progressRepo.findOne({
        where: { user: { id: user.id } },
        order: { startedAt: "DESC" },
      });

      // 1) User chưa học bao giờ
      if (!lastProgress) {
        await this.sendNeverLearnedReminder(user);
        continue;
      }

      // 2) User không học > 7 ngày
      const lastTime = new Date(lastProgress.startedAt);
      const diffDays = Math.floor(
        (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 7) {
        await this.sendInactive7DaysReminder(user, diffDays);
      }
    }
  }

  //--------------------------
  // Email
  //--------------------------

  // User chưa học bao giờ
  private async sendNeverLearnedReminder(user: User) {
    await this.sendMail(
      user.email,
      "Hãy bắt đầu bài học đầu tiên của bạn!",
      `
        <p>Chào <b>${user.name || user.email}</b>,</p>
        <p>Có vẻ như bạn vẫn chưa bắt đầu bài học nào.</p>
        <p>Hãy thử hoàn thành bài học đầu tiên để bắt đầu hành trình nhé! 🚀</p>
      `
    );
  }

  // User nghỉ học > 7 ngày
  private async sendInactive7DaysReminder(user: User, diffDays: number) {
    await this.sendMail(
      user.email,
      `Bạn đã ${diffDays} ngày không học — quay lại ngay nhé!`,
      `
        <p>Chào <b>${user.name || user.email}</b>,</p>
        <p>Chúng tôi nhận thấy bạn đã <b>${diffDays} ngày</b> không học bài.</p>
        <p>Hãy quay lại để duy trì phong độ và không đánh mất động lực nhé! 💪</p>
      `
    );
  }

  //--------------------------
  // Hàm gửi mail chung
  //--------------------------
  private async sendMail(to: string, subject: string, html: string) {
    await transporter.sendMail({
      from: `"AlearnG" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`📩 Email đã gửi tới: ${to} — ${subject}`);
  }
}

export const inactiveUserService = new InactiveUserService();
