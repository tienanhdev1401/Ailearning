import { Namespace, Server } from "socket.io";
import { Server as HttpServer } from "http";

let aiChatNamespace: Namespace | null = null;
let supportChatNamespace: Namespace | null = null;

const aiRoomName = (conversationId: number) => `ai-session-${conversationId}`;
const supportRoomName = (conversationId: number) => `support-session-${conversationId}`;

export function setupSocket(server: HttpServer) {
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  aiChatNamespace = io.of("/ai-chat");
  aiChatNamespace.on("connection", (socket) => {
    console.log("🤖 AI chat socket connected:", socket.id);

    socket.on("join_session", ({ conversationId }) => {
      if (!conversationId) {
        return;
      }
      socket.join(aiRoomName(conversationId));
      console.log(`🔗 Socket ${socket.id} joined AI session ${conversationId}`);
    });

    socket.on("leave_session", ({ conversationId }) => {
      if (!conversationId) {
        return;
      }
      socket.leave(aiRoomName(conversationId));
    });

    socket.on("disconnect", () => {
      console.log("❌ AI chat socket disconnected:", socket.id);
    });
  });

  supportChatNamespace = io.of("/support-chat");
  supportChatNamespace.on("connection", (socket) => {
    console.log("💬 Support chat socket connected:", socket.id);

    socket.on("join_conversation", ({ conversationId }) => {
      if (!conversationId) {
        return;
      }
      socket.join(supportRoomName(conversationId));
    });

    socket.on("leave_conversation", ({ conversationId }) => {
      if (!conversationId) {
        return;
      }
      socket.leave(supportRoomName(conversationId));
    });

    socket.on("disconnect", () => {
      console.log("❌ Support chat socket disconnected:", socket.id);
    });
  });
}

export function emitAiChatEvent(conversationId: number, event: string, payload: unknown) {
  if (!aiChatNamespace) {
    return;
  }
  aiChatNamespace.to(aiRoomName(conversationId)).emit(event, payload);
}

export function emitSupportChatEvent(conversationId: number, event: string, payload: unknown) {
  if (!supportChatNamespace) {
    return;
  }
  supportChatNamespace.to(supportRoomName(conversationId)).emit(event, payload);
}
