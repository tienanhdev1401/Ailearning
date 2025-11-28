export const socket = {
  connect() {
    if (process.env.NODE_ENV !== "production") {
      console.warn("socket.js legacy client removed. No connection established.");
    }
  },
  disconnect() {
    /* no-op */
  },
  emit() {
    throw new Error("Legacy socket channel has been removed.");
  },
  on() {
    /* no-op */
  },
  off() {
    /* no-op */
  },
};
