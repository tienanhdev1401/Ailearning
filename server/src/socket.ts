import { Namespace, Server } from "socket.io";
import { AppDataSource } from "./config/database";
import { Server as HttpServer } from "http";
import { User } from "./models/user";
import { Conversation } from "./models/conversation";
import { Message } from "./models/message";
import USER_ROLE from "./enums/userRole.enum";

let ioInstance: Server | null = null;
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

  ioInstance = io;

  // Lưu socketId theo userId
  const userSockets = new Map<number, string>();

  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("register", ({ userId }) => {
      userSockets.set(userId, socket.id);
      console.log(`📶 User ${userId} connected via socket ${socket.id}`);
    });

    /**
     * Khi student bắt đầu chat:
     * - Kiểm tra đã có conversation chưa
     * - Nếu chưa có => tìm staff ít conversation nhất
     * - Tạo conversation mới và thông báo
     */
    socket.on("start_conversation", async ({ studentId }) => {
      const userRepo = AppDataSource.getRepository(User);
      const convRepo = AppDataSource.getRepository(Conversation);

      const student = await userRepo.findOne({
        where: { id: studentId },
        relations: ["studentConversations"],
      });

      if (!student) {
        socket.emit("error_message", "❌ Không tìm thấy student");
        return;
      }

      // 🔍 Kiểm tra student đã có conversation chưa
      if (student.studentConversations.length > 0) {
        const existingConv = student.studentConversations[0];
        socket.emit("conversation_exists", existingConv);
        console.log(
          `⚠️ Student ${student.id} đã có conversation #${existingConv.id}`
        );
        return;
      }

      // 🔍 Lấy danh sách staff cùng số conversation
      const staffs = await userRepo.find({
        where: { role: USER_ROLE.STAFF },
        relations: ["staffConversations"],
      });

      if (staffs.length === 0) {
        socket.emit("error_message", "❌ Không có staff nào hoạt động");
        return;
      }

      // 🔍 Chọn staff có ít conversation nhất
      let chosenStaff = staffs[0];
      for (const s of staffs) {
        if (s.staffConversations.length < chosenStaff.staffConversations.length) {
          chosenStaff = s;
        }
      }

      // ✅ Tạo conversation mới
      const newConv = convRepo.create({
        student,
        staff: chosenStaff,
      });
      await convRepo.save(newConv);

      // 🔔 Gửi thông báo cho student
      socket.emit("conversation_created", newConv);

      // 🔔 Gửi thông báo cho staff được chọn
      const staffSocketId = userSockets.get(chosenStaff.id);
      if (staffSocketId)
        io.to(staffSocketId).emit("new_conversation", newConv);

      console.log(
        `🎯 Student ${student.id} được gán cho Staff ${chosenStaff.id} (conv #${newConv.id})`
      );
    });

    /**
     * Gửi tin nhắn
     */
    socket.on("send_message", async ({ conversationId, senderId, content }) => {
      const msgRepo = AppDataSource.getRepository(Message);
      const convRepo = AppDataSource.getRepository(Conversation);
      const userRepo = AppDataSource.getRepository(User);

      const conversation = await convRepo.findOne({
        where: { id: conversationId },
        relations: ["student", "staff"],
      });

      if (!conversation) {
        socket.emit("error_message", "❌ Conversation không tồn tại");
        return;
      }

      const sender = await userRepo.findOneBy({ id: senderId });
      if (!sender) return;

      const message = msgRepo.create({ conversation, sender, content });
      await msgRepo.save(message);

      const receiverId =
        senderId === conversation.student.id
          ? conversation.staff.id
          : conversation.student.id;

      // Gửi cho cả người gửi lẫn người nhận
      const receiverSocketId = userSockets.get(receiverId);
      io.to(socket.id).emit("receive_message", message);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("receive_message", message);
    });

    socket.on("disconnect", () => {
      for (const [id, sid] of userSockets.entries()) {
        if (sid === socket.id) {
          userSockets.delete(id);
          console.log(`❌ User ${id} disconnected`);
        }
      }
    });
  });

  aiChatNamespace = io.of("/ai-chat");
  aiChatNamespace.on("connection", (socket) => {
    console.log("🤖 AI chat socket connected:", socket.id);

    socket.on("join_session", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(aiRoomName(conversationId));
      console.log(`🔗 Socket ${socket.id} joined AI session ${conversationId}`);
    });

    socket.on("leave_session", ({ conversationId }) => {
      if (!conversationId) return;
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
