import { AppDataSource } from "../config/database";
import { SubscriptionPackage } from "../models/subscriptionPackage";
import { Transaction } from "../models/transaction";
import { UserSubscription } from "../models/userSubscription";
import { VnpayService, VnPayCreateUrlParams } from "./vnpay.service";
import { TRANSACTION_STATUS } from "../enums/transactionStatus.enum";
import { SubscriptionService } from "./subscription.service";

export class PaymentService {
  private vnpayService: VnpayService;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.vnpayService = new VnpayService();
    this.subscriptionService = new SubscriptionService();
  }

  async createPaymentUrl(
    userId: number,
    packageId: number,
    returnUrl: string,
    ipnUrl: string,
    ipAddr: string
  ): Promise<string> {
    const packageRepo = AppDataSource.getRepository(SubscriptionPackage);
    const transactionRepo = AppDataSource.getRepository(Transaction);

    const subPackage = await packageRepo.findOne({ where: { id: packageId } });
    if (!subPackage) {
      throw new Error("Package not found");
    }

    // Kiểm tra nếu là gói vĩnh viễn và người dùng đã mua rồi
    if (!subPackage.durationInDays) {
      const isOwned = await this.subscriptionService.hasPermanentPackage(userId, packageId);
      if (isOwned) {
        throw new Error("Bạn đã sở hữu gói vĩnh viễn này rồi, không cần mua thêm.");
      }
    }

    // Create a new PENDING transaction
    const newTransaction = transactionRepo.create({
      userId,
      packageId,
      amount: subPackage.price,
      status: TRANSACTION_STATUS.PENDING,
    });
    const savedTransaction = await transactionRepo.save(newTransaction);

    // Create VNPAY URL
    const orderId = savedTransaction.id.toString();
    savedTransaction.vnpayTxnRef = orderId;
    await transactionRepo.save(savedTransaction);

    const paymentParams: VnPayCreateUrlParams = {
      orderId: orderId,
      amount: subPackage.price,
      orderInfo: `Thanh toan goi ${subPackage.name}`,
      returnUrl: returnUrl,
      ipnUrl: ipnUrl,
    };

    return this.vnpayService.createPaymentUrl(paymentParams);
  }

  async handleVnpayIpn(query: Record<string, string>): Promise<{ RspCode: string; Message: string }> {
    console.log("query", query);
    const verifyResult = this.vnpayService.verifyReturnUrl(query);

    if (!verifyResult.isValid) {
      return { RspCode: "97", Message: "Invalid signature" };
    }

    const { vnpTxnRef, vnpAmount, vnpResponseCode } = verifyResult;

    const transactionId = vnpTxnRef;

    const transactionRepo = AppDataSource.getRepository(Transaction);
    const subRepo = AppDataSource.getRepository(UserSubscription);
    const packageRepo = AppDataSource.getRepository(SubscriptionPackage);

    const transaction = await transactionRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      console.log(`[IPN] Transaction ID ${transactionId} not found`);
      return { RspCode: "01", Message: "Order not found" };
    }

    console.log(`[IPN] Comparing Amount: DB=${transaction.amount} (type: ${typeof transaction.amount}), VNPAY=${vnpAmount} (type: ${typeof vnpAmount})`);

    if (transaction.status !== TRANSACTION_STATUS.PENDING) {
      return { RspCode: "02", Message: "Order already confirmed" };
    }

    // Use Number() to ensure type consistency and Math.abs for precision issues if any
    if (Math.abs(Number(transaction.amount) - Number(vnpAmount)) > 0.01) {
      console.log(`[IPN] Amount mismatch: Result=${vnpAmount}, Expected=${transaction.amount}`);
      return { RspCode: "04", Message: "Invalid amount" };
    }

    if (vnpResponseCode === "00") {
      transaction.status = TRANSACTION_STATUS.SUCCESS;
      await transactionRepo.save(transaction);

      const subPackage = await packageRepo.findOne({ where: { id: transaction.packageId } });
      if (subPackage) {
        await this.subscriptionService.activatePackageForUser(transaction.userId, subPackage);
      }
    } else {
      transaction.status = TRANSACTION_STATUS.FAILED;
      await transactionRepo.save(transaction);
    }

    return { RspCode: "00", Message: "Confirm Success" };
  }
}
