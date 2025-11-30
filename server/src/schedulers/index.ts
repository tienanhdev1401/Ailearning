import { scheduleInactiveUserReminder } from "./inactiveUser.scheduler";

export const startAllSchedulers = () => {
  scheduleInactiveUserReminder();
};
