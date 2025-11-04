import { userconfirmRepository } from "../repositories/userconfirm.repostitory";

export class UserConfirmService {
  static async create(userId: number, confirmedData: any) {
    const exists = await userconfirmRepository.exists(userId);
    if (exists) throw new Error("User confirm already exists");

    const record = userconfirmRepository.create({
      user: { id: userId },
      confirmedData,
    });

    return await userconfirmRepository.save(record);
  }

  static async checkFirstConfirm(userId: number): Promise<boolean> {
    return await userconfirmRepository.exists(userId);
  }


  static async getConfirmData(userId: number): Promise<any | null> {
    return await userconfirmRepository.getConfirmedData(userId);
  }
}
