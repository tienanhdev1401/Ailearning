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
 * Slide-in overlay panel showing the user's past AI conversations.
 * Selecting one calls onSelectSession(id). `onDelete` allows deleting a
 * session (with confirmation handled by the parent). `activeId` highlights
 * the currently opened session.
 */
const ConversationHistorySidebar = ({ open, onClose, onSelectSession, onDelete, activeId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
  }, [open, loadSessions]);

  const handleDelete = useCallback(
    async (event, sessionId) => {
      event.stopPropagation();
      if (!onDelete || deletingId) return;
      setDeletingId(sessionId);
      try {
        await onDelete(sessionId);
        // Remove from local list after successful deletion
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete, deletingId]
  );

  if (!open) {
    return null;
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div className={styles.sidebar}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headIcon}>💬</span>
            <span className={styles.headTitle}>Lịch sử trò chuyện</span>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.placeholder}>
              <div className={styles.spinner} />
              <span>Đang tải lịch sử...</span>
            </div>
          ) : error ? (
            <div className={styles.placeholder}>
              <p>{error}</p>
              <button type="button" className={styles.retryButton} onClick={loadSessions}>
                Thử lại
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyTitle}>Chưa có cuộc trò chuyện</div>
              <div className={styles.emptyDesc}>
                Bắt đầu phiên trò chuyện đầu tiên với AI và lịch sử sẽ hiện ở đây.
              </div>
            </div>
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
                      <span className={styles.metaChip}>
                        {session.mode === "voice" ? "🎙️" : "⌨️"} {modeLabels[session.mode] ?? session.mode}
                      </span>
                      <span className={styles.metaChip}>
                        💬 {session.messageCount} tin nhắn
                      </span>
                      <span className={styles.metaChip}>
                        🕐 {formatDate(session.createdAt)}
                      </span>
                    </div>
                    {onDelete && (
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={(event) => handleDelete(event, session.id)}
                        disabled={deletingId === session.id}
                        aria-label="Xóa cuộc trò chuyện"
                        title="Xóa cuộc trò chuyện"
                      >
                        {deletingId === session.id ? "..." : "🗑️"}
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.foot}>
          <span className={styles.footNote}>{sessions.length} cuộc trò chuyện</span>
        </div>
      </div>
    </>
  );
};

export default ConversationHistorySidebar;
