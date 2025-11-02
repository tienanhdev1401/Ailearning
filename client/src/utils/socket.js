// utils/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ⚙️ Cấu hình socket với tự động reconnect
export const socket = io(SOCKET_URL, {
  autoConnect: false, // ❌ không tự connect ngay, để React kiểm soát
  reconnection: true, // ✅ bật reconnect
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ["websocket"], // tránh lỗi polling
});

// Log sự kiện socket toàn cục
socket.on("connect", () => {
  console.log("✅ Kết nối socket thành công:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket bị ngắt kết nối:", reason);
});

socket.on("connect_error", (err) => {
  console.error("❌ Lỗi kết nối socket:", err.message);
});
