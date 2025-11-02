import React, { useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function StudentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [userId, setUserId] = useState(null);

  const conversationRef = useRef(null);
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // ✅ Lấy userId từ accessToken
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id);
      } catch {
        console.error("Token decode failed");
      }
    }
  }, []);

  // ✅ Khởi tạo socket, chỉ chạy khi có userId
  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) socket.connect();
    console.log("🎓 Socket connecting for student:", userId);

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Socket connected (student):", socket.id);
      socket.emit("register", { userId });
      socket.emit("start_conversation", { studentId: userId });
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("conversation_created", (conv) => {
      console.log("🆕 New conversation created:", conv.id);
      setConversation(conv);
      axios.get(`${API}/api/chat/messages/${conv.id}`).then((res) => setMessages(res.data));
    });

    socket.on("conversation_exists", (conv) => {
      console.log("ℹ️ Conversation exists:", conv.id);
      setConversation(conv);
      axios.get(`${API}/api/chat/messages/${conv.id}`).then((res) => setMessages(res.data));
    });

    socket.on("receive_message", (msg) => {
      const currentConv = conversationRef.current;
      if (currentConv && msg.conversation?.id === currentConv.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("error_message", (err) => alert(err));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("conversation_created");
      socket.off("conversation_exists");
      socket.off("receive_message");
      socket.off("error_message");
      // ❌ Không gọi socket.disconnect(), giữ socket toàn cục
    };
  }, [userId]);

  function send() {
    if (!conversation || !text.trim()) return;
    socket.emit("send_message", {
      conversationId: conversation.id,
      senderId: userId,
      content: text.trim(),
    });
    setText("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🎓 Student Chat</h2>
      <p>Socket: {connected ? "🟢 connected" : "🔴 disconnected"}</p>

      <div style={{ border: "1px solid #ddd", height: 300, overflowY: "auto", padding: 8 }}>
        {conversation ? (
          <>
            {messages.map((m) => (
              <div key={m.id ?? Math.random()} style={{ margin: "6px 0" }}>
                <b>{m.sender?.id === userId ? "You" : m.sender?.name ?? m.sender?.id}</b>:{" "}
                {m.content}
                <div style={{ fontSize: 11, color: "#666" }}>
                  {new Date(m.createdAt || m.created_at || Date.now()).toLocaleString()}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div>Đang khởi tạo cuộc trò chuyện...</div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="Nhập tin nhắn..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: 400 }}
        />
        <button onClick={send} style={{ marginLeft: 8 }}>
          Gửi
        </button>
      </div>
    </div>
  );
}
