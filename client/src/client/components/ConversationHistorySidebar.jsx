import React, { useCallback, useEffect, useState } from "react";
import AiChatService from "../../services/aiChatService";
import styles from "../styles/ConversationHistorySidebar.module.css";

const statusLabels = {
  active: "Đang diễn ra",
  completed: "Đã kết thúc",
};

const modeLabels = {
  voice: "Giọng nói",
  text: "Văn bản",
};

const formatDate = (value) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(parsed);
  } catch {
    return parsed.toLocaleString();
  }
};

/**
 * Read-only list of the user's past AI conversations. Selecting one calls
 * onSelectSession(id) so the parent can load and display it. `activeId`
 * highlights the currently opened session. `refreshKey` lets the parent
 * trigger a reload (e.g. after a new session is completed).
 */
const ConversationHistorySidebar = ({ open, onClose, onSelectSession, activeId, refreshKey }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AiChatService.listSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load AI conversation history", err);
      setError("Không tải được lịch sử. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open, refreshKey, loadSessions]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Lịch sử trò chuyện</span>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.placeholder}>Đang tải...</div>
        ) : error ? (
          <div className={styles.placeholder}>
            <p>{error}</p>
            <button type="button" className={styles.retryButton} onClick={loadSessions}>
              Thử lại
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className={styles.placeholder}>Chưa có cuộc trò chuyện nào được lưu.</div>
        ) : (
          <ul className={styles.list}>
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={`${styles.item} ${activeId === session.id ? styles.itemActive : ""}`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className={styles.itemTop}>
                    <span className={styles.itemTitle}>{session.title}</span>
                    <span
                      className={`${styles.badge} ${
                        session.status === "completed" ? styles.badgeDone : styles.badgeActive
                      }`}
                    >
                      {statusLabels[session.status] ?? session.status}
                    </span>
                  </div>
                  {session.lastMessagePreview && (
                    <p className={styles.preview}>{session.lastMessagePreview}</p>
                  )}
                  <div className={styles.meta}>
                    <span>{modeLabels[session.mode] ?? session.mode}</span>
                    <span>{session.messageCount} tin nhắn</span>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationHistorySidebar;
