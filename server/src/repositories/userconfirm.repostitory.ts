import { AppDataSource } from "../config/database";
import { UserConfirm } from "../models/userconfirm";

export const userconfirmRepository = AppDataSource.getRepository(UserConfirm).extend({

  async exists(userId: number): Promise<boolean> {
    const exists = await this.createQueryBuilder("user_confirm")
    .where("user_confirm.user_id = :userId", { userId })
    .getCount();

    return exists > 0;
  },


  async getConfirmedData(userId: number): Promise<any | null> {
    const record = await this.createQueryBuilder("user_confirm")
      .leftJoinAndSelect("user_confirm.user", "user")
      .where("user.id = :userId", { userId })
      .getOne();

    return record ? record.confirmedData : null;
  },


});
