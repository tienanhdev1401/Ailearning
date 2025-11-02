import React, { useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function StaffChat() {
  const [userId, setUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);

  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ✅ Lấy staff ID từ token
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

  // ✅ Kết nối socket và tải conversation
  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) socket.connect();
    console.log("🧑‍🏫 Socket connecting for staff:", userId);

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Socket connected (staff):", socket.id);
      socket.emit("register", { userId });

      // Load các conversation cũ
      axios
        .get(`${API}/api/chat/conversations/${userId}`)
        .then((res) => setConversations(res.data))
        .catch(() => {});
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("new_conversation", (conv) => {
      console.log("🆕 New conversation assigned:", conv.id);
      setConversations((prev) => {
        if (prev.find((p) => p.id === conv.id)) return prev;
        return [...prev, conv];
      });
    });

    socket.on("receive_message", (msg) => {
      const current = activeRef.current;
      if (current && msg.conversation?.id === current.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("error_message", (err) => alert(err));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_conversation");
      socket.off("receive_message");
      socket.off("error_message");
    };
  }, [userId]);

  function openConv(conv) {
    setActive(conv);
    axios
      .get(`${API}/api/chat/messages/${conv.id}`)
      .then((res) => setMessages(res.data))
      .catch(() => setMessages([]));
  }

  function send() {
    if (!active) return alert("Chọn conversation");
    if (!text.trim()) return;
    socket.emit("send_message", {
      conversationId: active.id,
      senderId: userId,
      content: text.trim(),
    });
    setText("");
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🧑‍🏫 Staff Chat</h2>
      <div style={{ marginBottom: 8 }}>
        <span>Socket: {connected ? "🟢 connected" : "🔴 disconnected"}</span>
        {userId && (
          <span style={{ marginLeft: 12, fontStyle: "italic" }}>
            (Staff ID: {userId})
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ width: 260 }}>
          <h4>Conversations</h4>
          <div
            style={{
              border: "1px solid #eee",
              padding: 8,
              height: 360,
              overflowY: "auto",
            }}
          >
            {conversations.length === 0 && <div>Chưa có conversation</div>}
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => openConv(c)}
                style={{
                  padding: 8,
                  cursor: "pointer",
                  background: active?.id === c.id ? "#f0f0f0" : "transparent",
                  borderBottom: "1px solid #fafafa",
                }}
              >
                #{c.id} — Student: {c.student?.id ?? c.student_id}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4>Chat</h4>
          <div
            style={{
              border: "1px solid #ddd",
              height: 360,
              overflowY: "auto",
              padding: 8,
            }}
          >
            {active ? (
              messages.map((m) => (
                <div key={m.id ?? Math.random()} style={{ margin: 6 }}>
                  <b>
                    {m.sender?.id === userId ? "You" : m.sender?.name ?? m.sender?.id}
                  </b>
                  : {m.content}
                  <div style={{ fontSize: 11, color: "#666" }}>
                    {new Date(
                      m.createdAt || m.created_at || Date.now()
                    ).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div>Chọn conversation để xem tin nhắn</div>
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              placeholder="Nhập tin nhắn..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ width: "70%" }}
            />
            <button onClick={send} style={{ marginLeft: 8 }}>
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
