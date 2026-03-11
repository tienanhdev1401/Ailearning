import { AppDataSource } from "../config/database";
import { UserSubscription } from "../models/userSubscription";
import { SubscriptionPackage } from "../models/subscriptionPackage";
import { MoreThan, IsNull } from "typeorm";

export class SubscriptionService {
  private subscriptionRepo = AppDataSource.getRepository(UserSubscription);

  async activatePackageForUser(userId: number, subPackage: SubscriptionPackage): Promise<UserSubscription> {
    // 1. Tìm xem user đã có gói cùng loại và còn hạn không
    const existingSub = await this.subscriptionRepo.findOne({
      where: {
        userId,
        package: { type: subPackage.type },
        isActive: true,
        // Chỉ cộng dồn nếu gói đó có ngày hết hạn (không phải vĩnh viễn)
        // Nếu là gói vĩnh viễn (endDate null) thì không cần cộng dồn
      },
      relations: ["package"],
      order: { endDate: "DESC" }
    });

    const now = new Date();
    let startDate = now;
    let endDate: Date | null = null;

    if (subPackage.durationInDays) {
      if (existingSub && existingSub.endDate && existingSub.endDate > now) {
        // Cộng dồn vào ngày hết hạn cũ
        startDate = existingSub.startDate; // Giữ nguyên ngày bắt đầu cũ hoặc dùng now tùy logic, nhưng endDate mới quan trọng
        endDate = new Date(existingSub.endDate);
        endDate.setDate(endDate.getDate() + subPackage.durationInDays);
        existingSub.endDate = endDate;
        existingSub.packageId = subPackage.id;
        return this.subscriptionRepo.save(existingSub);
      } else {
        // Tạo mới hoàn toàn
        endDate = new Date();
        endDate.setDate(now.getDate() + subPackage.durationInDays);
      }
    } else {
      // Gói vĩnh viễn
      endDate = null;
    }

    const newSub = this.subscriptionRepo.create({
      userId,
      packageId: subPackage.id,
      startDate,
      endDate,
      isActive: true,
    });

    return this.subscriptionRepo.save(newSub);
  }

  async hasPermanentPackage(userId: number, packageId: number): Promise<boolean> {
    const existingSub = await this.subscriptionRepo.findOne({
      where: {
        userId,
        packageId,
        isActive: true,
        endDate: IsNull() // endDate null có nghĩa là vĩnh viễn
      }
    });
    return !!existingSub;
  }

  async checkUserAccess(userId: number, packageType: string): Promise<boolean> {
    const now = new Date();
    const sub = await this.subscriptionRepo.findOne({
      where: [
        { userId, package: { type: packageType as any }, isActive: true, endDate: MoreThan(now) },
        { userId, package: { type: packageType as any }, isActive: true, endDate: IsNull() }
      ],
      relations: ["package"]
    });
    return !!sub;
  }

  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return this.subscriptionRepo.find({
      where: { userId },
      relations: ["package"],
      order: { startDate: "DESC" }
    });
  }
}
