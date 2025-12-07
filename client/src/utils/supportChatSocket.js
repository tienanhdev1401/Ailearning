import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const createSupportChatSocket = () =>
  io(`${SOCKET_URL}/support-chat`, {
    autoConnect: false,
    transports: ["websocket"],
    withCredentials: true,
  });

export default createSupportChatSocket;
