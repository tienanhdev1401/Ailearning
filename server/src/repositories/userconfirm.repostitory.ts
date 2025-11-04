// src/repositories/UserConfirmRepository.ts
import { AppDataSource } from "../config/database";
import { UserConfirm } from "../models/userconfirm";
import { User } from "../models/user";

export const userconfirmRepository = AppDataSource.getRepository(UserConfirm).extend({

  async exists(userId: number): Promise<boolean> {
    const record = await this.createQueryBuilder("user_confirm")
      .leftJoinAndSelect("user_confirm.user", "user")
      .where("user.id = :userId", { userId })
      .getOne();

    return !!record;
  },


  async getConfirmedData(userId: number): Promise<any | null> {
    const record = await this.createQueryBuilder("user_confirm")
      .leftJoinAndSelect("user_confirm.user", "user")
      .where("user.id = :userId", { userId })
      .getOne();

    return record ? record.confirmedData : null;
  },

  
});
