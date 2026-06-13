import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AiChatService from "../../services/aiChatService";
import LoadingSpinner from "../../component/LoadingSpinner";
import styles from "../styles/AiChatHistoryPage.module.css";

const statusLabels = {
  active: "\u0110ang di\u1ec5n ra",
  completed: "\u0110\u00e3 k\u1ebft th\u00fac",
};

const modeLabels = {
  voice: "Gi\u1ecdng n\u00f3i",
  text: "V\u0103n b\u1ea3n",
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
      setListError("Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c l\u1ecbch s\u1eed tr\u00f2 chuy\u1ec7n. Vui l\u00f2ng th\u1eed l\u1ea1i.");
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
      setDetailError("Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c n\u1ed9i dung cu\u1ed9c tr\u00f2 chuy\u1ec7n n\u00e0y.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const selectedSummary = useMemo(
    () => sessions.find((item) => item.id === selectedId) ?? null,
    [sessions, selectedId]
  );

  if (loadingList) {
    return <LoadingSpinner text="\u0110ang t\u1ea3i l\u1ecbch s\u1eed tr\u00f2 chuy\u1ec7n..." />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>L\u1ecbch s\u1eed tr\u00f2 chuy\u1ec7n AI</h1>
          <p className={styles.subtitle}>
            Xem l\u1ea1i c\u00e1c bu\u1ed5i nh\u1eadp vai \u0111\u00e3 qua, nghe l\u1ea1i ghi \u00e2m c\u1ee7a b\u1ea1n v\u00e0 \u0111\u1ecdc l\u1ea1i \u0111\u00e1nh gi\u00e1.
          </p>
        </div>
        <button className={styles.backButton} onClick={() => navigate("/experience/ai-chat")}>
          \u2190 Quay l\u1ea1i tr\u00f2 chuy\u1ec7n
        </button>
      </header>

      {listError ? (
        <div className={styles.emptyState}>
          <p>{listError}</p>
          <button className={styles.retryButton} onClick={loadSessions}>
            Th\u1eed l\u1ea1i
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Ch\u01b0a c\u00f3 cu\u1ed9c tr\u00f2 chuy\u1ec7n n\u00e0o</h3>
          <p>H\u00e3y b\u1eaft \u0111\u1ea7u m\u1ed9t bu\u1ed5i nh\u1eadp vai \u0111\u1ec3 l\u01b0u l\u1ea1i t\u1ea1i \u0111\u00e2y.</p>
          <button className={styles.retryButton} onClick={() => navigate("/experience/ai-chat")}>
            B\u1eaft \u0111\u1ea7u ngay
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
                  <span>{session.messageCount} tin nh\u1eafn</span>
                  <span>{formatDateTime(session.createdAt)}</span>
                </div>
              </button>
            ))}
          </aside>

          <section className={styles.detailPanel}>
            {!selectedId ? (
              <div className={styles.detailPlaceholder}>
                Ch\u1ecdn m\u1ed9t cu\u1ed9c tr\u00f2 chuy\u1ec7n \u1edf b\u00ean tr\u00e1i \u0111\u1ec3 xem l\u1ea1i n\u1ed9i dung.
              </div>
            ) : loadingDetail ? (
              <LoadingSpinner text="\u0110ang t\u1ea3i n\u1ed9i dung..." />
            ) : detailError ? (
              <div className={styles.emptyState}>
                <p>{detailError}</p>
                <button className={styles.retryButton} onClick={() => openSession(selectedId)}>
                  Th\u1eed l\u1ea1i
                </button>
              </div>
            ) : detail ? (
              <>
                <div className={styles.detailHeader}>
                  <h2>{selectedSummary?.title ?? "Cu\u1ed9c tr\u00f2 chuy\u1ec7n"}</h2>
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
                          {isUser ? "B\u1ea1n" : "AelanG AI"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {detail.evaluation?.summary && (
                  <div className={styles.evaluationBox}>
                    <h3>T\u00f3m t\u1eaft \u0111\u00e1nh gi\u00e1</h3>
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
