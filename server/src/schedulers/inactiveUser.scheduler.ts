import cron from "node-cron";
import { inactiveUserService } from "../services/inactiveUser.service";

export const scheduleInactiveUserReminder = () => {
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log("⏰ Scheduler chạy lúc 07:00 sáng (Asia/Ho_Chi_Minh)");
      await inactiveUserService.checkInactiveUsers();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );
};
