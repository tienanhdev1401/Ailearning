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

    Object.assign(subPackage, data);
    return this.packageRepo.save(subPackage);
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await this.packageRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
