import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiChatService from "../../services/aiChatService";
import LoadingSpinner from "../../component/LoadingSpinner";
import styles from "../styles/AiChatHistoryPage.module.css";

const statusLabels = {
  active: "Đang diễn ra",
  completed: "Đã kết thúc",
};

const modeLabels = {
  voice: "Giọng nói",
  text: "Văn bản",
};

const formatDateTime = (value) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(parsed);
  } catch {
    return parsed.toLocaleString();
  }
};

const AiChatHistoryPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const data = await AiChatService.listSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load AI conversation history", error);
      setListError("Không tải được lịch sử trò chuyện. Vui lòng thử lại.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const openSession = useCallback(async (sessionId) => {
    setSelectedId(sessionId);
    setLoadingDetail(true);
    setDetailError(null);
    setDetail(null);
    try {
      const data = await AiChatService.getHistory(sessionId);
      setDetail(data);
    } catch (error) {
      console.error("Failed to load conversation detail", error);
      setDetailError("Không tải được nội dung cuộc trò chuyện này.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const selectedSummary = useMemo(
    () => sessions.find((item) => item.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  if (loadingList) {
    return <LoadingSpinner text="Đang tải lịch sử trò chuyện..." />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Lịch sử trò chuyện AI</h1>
          <p className={styles.subtitle}>
            Xem lại các buổi nhập vai đã qua, nghe lại ghi âm của bạn và đọc lại đánh giá.
          </p>
        </div>
        <button className={styles.backButton} onClick={() => navigate("/experience/ai-chat")}>
          ← Quay lại trò chuyện
        </button>
      </header>

      {listError ? (
        <div className={styles.emptyState}>
          <p>{listError}</p>
          <button className={styles.retryButton} onClick={loadSessions}>
            Thử lại
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Chưa có cuộc trò chuyện nào</h3>
          <p>Hãy bắt đầu một buổi nhập vai để lưu lại tại đây.</p>
          <button className={styles.retryButton} onClick={() => navigate("/experience/ai-chat")}>
            Bắt đầu ngay
          </button>
        </div>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.sessionList}>
            {sessions.map((session) => (
              <button
                key={session.id}
                className={`${styles.sessionCard} ${
                  selectedId === session.id ? styles.sessionCardActive : ""
                }`}
                onClick={() => openSession(session.id)}
              >
                <div className={styles.sessionCardTop}>
                  <span className={styles.sessionTitle}>{session.title}</span>
                  <span
                    className={`${styles.statusBadge} ${
                      session.status === "completed" ? styles.statusCompleted : styles.statusActive
                    }`}
                  >
                    {statusLabels[session.status] ?? session.status}
                  </span>
                </div>
                {session.lastMessagePreview && (
                  <p className={styles.sessionPreview}>{session.lastMessagePreview}</p>
                )}
                <div className={styles.sessionMeta}>
                  <span>{modeLabels[session.mode] ?? session.mode}</span>
                  <span>{session.messageCount} tin nhắn</span>
                  <span>{formatDateTime(session.createdAt)}</span>
                </div>
              </button>
            ))}
          </aside>

          <section className={styles.detailPanel}>
            {!selectedId ? (
              <div className={styles.detailPlaceholder}>
                Chọn một cuộc trò chuyện ở bên trái để xem lại nội dung.
              </div>
            ) : loadingDetail ? (
              <LoadingSpinner text="Đang tải nội dung..." />
            ) : detailError ? (
              <div className={styles.emptyState}>
                <p>{detailError}</p>
                <button className={styles.retryButton} onClick={() => openSession(selectedId)}>
                  Thử lại
                </button>
              </div>
            ) : detail ? (
              <>
                <div className={styles.detailHeader}>
                  <h2>{selectedSummary?.title ?? "Cuộc trò chuyện"}</h2>
                  <span className={styles.detailDate}>{formatDateTime(detail.createdAt)}</span>
                </div>

                <div className={styles.messages}>
                  {(detail.messages ?? []).map((message) => {
                    const isUser = message.role === "user";
                    const text = message.transcript || message.content || "";
                    return (
                      <div
                        key={message.id}
                        className={`${styles.messageRow} ${isUser ? styles.user : ""}`}
                      >
                        <div className={styles.messageBubble}>
                          <span className={styles.messageText}>{text}</span>
                          {message.audioPath && (
                            <audio
                              className={styles.messageAudio}
                              controls
                              preload="none"
                              src={message.audioPath}
                            />
                          )}
                        </div>
                        <div className={styles.messageMeta}>
                          {isUser ? "Bạn" : "AelanG AI"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {detail.evaluation?.summary && (
                  <div className={styles.evaluationBox}>
                    <h3>Tóm tắt đánh giá</h3>
                    <p>{detail.evaluation.summary}</p>
                  </div>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
};

export default AiChatHistoryPage;
