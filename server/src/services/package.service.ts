import { AppDataSource } from "../config/database";
import { SubscriptionPackage } from "../models/subscriptionPackage";
import { PACKAGE_TYPE } from "../enums/packageType.enum";

export class PackageService {
  private packageRepo = AppDataSource.getRepository(SubscriptionPackage);

  async getAllPackages(type?: PACKAGE_TYPE): Promise<SubscriptionPackage[]> {
    if (type) {
      return this.packageRepo.find({ where: { type } });
    }
    return this.packageRepo.find();
  }

  async getPackageById(id: number): Promise<SubscriptionPackage | null> {
    return this.packageRepo.findOne({ where: { id } });
  }

  async createPackage(data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage> {
    const newPackage = this.packageRepo.create(data);
    return this.packageRepo.save(newPackage);
  }

  async updatePackage(id: number, data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage | null> {
    const subPackage = await this.packageRepo.findOne({ where: { id } });
    if (!subPackage) {
      return null;
    }

    // Validation: Roadmap packages must have a targetId
    if (data.type === PACKAGE_TYPE.ROADMAP_UNLOCK && !data.targetId && !subPackage.targetId) {
      throw new Error("Roadmap Unlock packages must specify a target Roadmap ID.");
    }

    // Sanitize data
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.durationInDays !== undefined) data.durationInDays = data.durationInDays === 0 ? 0 : (data.durationInDays ? Number(data.durationInDays) : null);

    Object.assign(subPackage, data);
    return this.packageRepo.save(subPackage);
  }

  async deletePackage(id: number): Promise<boolean> {
    const subPackage = await this.packageRepo.findOne({ where: { id } });
    if (!subPackage) return false;

    // Check if there are any user subscriptions linked to this package
    const userSubRepo = AppDataSource.getRepository("UserSubscription");
    const subCount = await userSubRepo.count({ where: { packageId: id } });

    if (subCount > 0) {
      // Instead of hard delete, we could mark as inactive, but for now let's prevent delete
      throw new Error("Cannot delete package: There are users currently subscribed to this package.");
    }

    const result = await this.packageRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
