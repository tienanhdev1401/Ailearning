import { AppDataSource } from "../config/database";
import { UserCredit } from "../models/userCredit";
import { MoreThan } from "typeorm";

export class CreditService {
  private creditRepo = AppDataSource.getRepository(UserCredit);

  /**
   * Reset daily credits for free users
   */
  async resetDailyCreditsIfNecessary(userId: number): Promise<UserCredit | null> {
    let credit = await this.creditRepo.findOne({ where: { userId } });
    
    // Create credits if not exist (lazy creation)
    if (!credit) {
      credit = this.creditRepo.create({ userId });
      return this.creditRepo.save(credit);
    }

    const now = new Date();
    const lastReset = new Date(credit.lastCreditReset);

    // Check if it's a different day
    if (
      now.getFullYear() !== lastReset.getFullYear() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getDate() !== lastReset.getDate()
    ) {
      const hasSubscription = await this.checkActiveSubscription(userId);

      if (!hasSubscription) {
        credit.aiConversationCredits = 10;
        credit.totalAiConversationCredits = 10;
        credit.grammarCheckerCredits = 5;
        credit.totalGrammarCheckerCredits = 5;
        credit.lastCreditReset = now;
        return this.creditRepo.save(credit);
      }
    }
    return credit;
  }

  private async checkActiveSubscription(userId: number): Promise<boolean> {
    const userSubRepo = AppDataSource.getRepository("UserSubscription");
    const now = new Date();
    const sub = await userSubRepo.findOne({
      where: [
        { userId, isActive: true, endDate: MoreThan(now) },
        { userId, isActive: true, endDate: null }
      ]
    });
    return !!sub;
  }

  /**
   * Consume 1 credit of a specific type
   */
  async consumeCredit(userId: number, type: "AI_CONVERSATION" | "GRAMMAR_CHECKER"): Promise<boolean> {
    const credit = await this.resetDailyCreditsIfNecessary(userId);
    if (!credit) return false;

    if (type === "AI_CONVERSATION") {
      if (credit.aiConversationCredits > 0) {
        credit.aiConversationCredits -= 1;
        await this.creditRepo.save(credit);
        return true;
      }
    } else if (type === "GRAMMAR_CHECKER") {
      if (credit.grammarCheckerCredits > 0) {
        credit.grammarCheckerCredits -= 1;
        await this.creditRepo.save(credit);
        return true;
      }
    }

    return false;
  }

  /**
   * Refund 1 credit of a specific type. Used to roll back a consumed credit
   * when the action it was charged for fails to start. The balance is capped
   * at the user's total limit so a refund can never exceed the daily quota.
   */
  async refundCredit(userId: number, type: "AI_CONVERSATION" | "GRAMMAR_CHECKER"): Promise<void> {
    const credit = await this.creditRepo.findOne({ where: { userId } });
    if (!credit) return;

    if (type === "AI_CONVERSATION") {
      credit.aiConversationCredits = Math.min(
        credit.aiConversationCredits + 1,
        credit.totalAiConversationCredits
      );
    } else if (type === "GRAMMAR_CHECKER") {
      credit.grammarCheckerCredits = Math.min(
        credit.grammarCheckerCredits + 1,
        credit.totalGrammarCheckerCredits
      );
    }

    await this.creditRepo.save(credit);
  }

  async getRemainingCredits(userId: number) {
    const credit = await this.resetDailyCreditsIfNecessary(userId);
    if (credit) {
      // Heal data for legacy users
      let needsSave = false;
      if (credit.totalAiConversationCredits < credit.aiConversationCredits) {
        credit.totalAiConversationCredits = credit.aiConversationCredits;
        needsSave = true;
      }
      if (credit.totalGrammarCheckerCredits < credit.grammarCheckerCredits) {
        credit.totalGrammarCheckerCredits = credit.grammarCheckerCredits;
        needsSave = true;
      }
      if (needsSave) await this.creditRepo.save(credit);
    }
    return credit;
  }
}
