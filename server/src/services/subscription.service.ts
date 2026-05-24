import { AppDataSource } from "../config/database";
import { UserSubscription } from "../models/userSubscription";
import { SubscriptionPackage } from "../models/subscriptionPackage";
import { UserCredit } from "../models/userCredit";
import { MoreThan, IsNull } from "typeorm";

export class SubscriptionService {
  private subscriptionRepo = AppDataSource.getRepository(UserSubscription);

  async activatePackageForUser(userId: number, subPackage: SubscriptionPackage, customMultiplier: number = 1): Promise<UserSubscription> {
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
    let savedSub: UserSubscription;

    if (subPackage.durationInDays && existingSub && existingSub.endDate && existingSub.endDate > now) {
      // Cộng dồn vào ngày hết hạn cũ
      startDate = existingSub.startDate;
      endDate = new Date(existingSub.endDate);
      endDate.setDate(endDate.getDate() + subPackage.durationInDays);
      existingSub.endDate = endDate;
      existingSub.packageId = subPackage.id;
      savedSub = await this.subscriptionRepo.save(existingSub);
    } else {
      // Tạo mới hoàn toàn (gói mới, gói cũ đã hết hạn, hoặc gói vĩnh viễn)
      if (subPackage.durationInDays) {
        endDate = new Date();
        endDate.setDate(now.getDate() + subPackage.durationInDays);
      } else {
        endDate = null;
      }
      
      const newSub = this.subscriptionRepo.create({
        userId,
        packageId: subPackage.id,
        startDate,
        endDate,
        isActive: true,
      });
      savedSub = await this.subscriptionRepo.save(newSub);
    }

    // Update user credits
    const creditRepo = AppDataSource.getRepository(UserCredit);
    let credit = await creditRepo.findOne({ where: { userId } });
    if (!credit) {
      credit = creditRepo.create({ 
        userId,
        aiConversationCredits: 10,
        totalAiConversationCredits: 10,
        grammarCheckerCredits: 5,
        totalGrammarCheckerCredits: 5
      });
    }
    
    // Sử dụng customMultiplier truyền vào (mặc định là 1 nếu không có)
    const finalMultiplier = customMultiplier || 1;
    const addedAi = (subPackage.aiConversationCredits || 0) * finalMultiplier;
    const addedGrammar = (subPackage.grammarCheckerCredits || 0) * finalMultiplier;

    credit.aiConversationCredits = (credit.aiConversationCredits || 0) + addedAi;
    credit.totalAiConversationCredits = (credit.totalAiConversationCredits || 0) + addedAi;
    
    credit.grammarCheckerCredits = (credit.grammarCheckerCredits || 0) + addedGrammar;
    credit.totalGrammarCheckerCredits = (credit.totalGrammarCheckerCredits || 0) + addedGrammar;

    await creditRepo.save(credit);

    return savedSub;
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
