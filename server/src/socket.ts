import { Namespace, Server } from "socket.io";
import { Server as HttpServer } from "http";

let aiChatNamespace: Namespace | null = null;

const aiRoomName = (conversationId: number) => `ai-session-${conversationId}`;

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
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
}

export function emitAiChatEvent(conversationId: number, event: string, payload: unknown) {
  if (!aiChatNamespace) {
    return;
  }
  aiChatNamespace.to(aiRoomName(conversationId)).emit(event, payload);
}
