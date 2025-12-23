import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./SupportChatWidget.module.css";
import { SupportChatService } from "../services/supportChatService";
import { createSupportChatSocket } from "../utils/supportChatSocket";
import { useToast } from "../context/ToastContext";

const normalizeMessage = (message) => {
  const created = message?.createdAt ? new Date(message.createdAt) : new Date();
  return {
    ...message,
    createdAt: created.toISOString(),
    createdAtMs: created.getTime(),
  };
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const statusLabelMap = {
  open: "Đang hỗ trợ",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
};

const SupportChatWidget = () => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [initializing, setInitializing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isLoginRoute = location.pathname.startsWith("/login");

  useEffect(() => {
    const stored = localStorage.getItem("supportChatEnabled");
    if (stored === "false") {
      setIsEnabled(false);
    }

    const handleToggle = (event) => {
      if (typeof event?.detail?.enabled === "boolean") {
        const enabled = event.detail.enabled;
        setIsEnabled(enabled);
        if (!enabled) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("support-chat-toggle", handleToggle);
    return () => window.removeEventListener("support-chat-toggle", handleToggle);
  }, []);

  const socketRef = useRef(null);
  const hasLoadedSessionRef = useRef(false);
  const messagesEndRef = useRef(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => a.createdAtMs - b.createdAtMs);
  }, [messages]);

  const ensureSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = createSupportChatSocket();
    }
    return socketRef.current;
  }, []);

  const disconnectSocket = useCallback(() => {
    if (!socketRef.current) {
      return;
    }
    const socket = socketRef.current;
    if (socket.connected) {
      socket.disconnect();
    }
    socketRef.current = null;
  }, []);

  const appendMessage = useCallback((rawMessage) => {
    const normalized = normalizeMessage(rawMessage);
    setMessages((prev) => {
      if (prev.some((item) => item.id === normalized.id)) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const refreshConversations = useCallback(async () => {
    setLoadingConversations(true);
    setHistoryError(null);
    try {
      const data = await SupportChatService.listMyConversations();
      setConversations((prev) => {
        const unreadMap = new Map(prev.map((item) => [item.id, item.hasUnread]));
        return data.map((item) => ({
          ...item,
          hasUnread: unreadMap.get(item.id) ?? false,
        }));
      });
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? "Không tải được lịch sử";
      setHistoryError(message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    refreshConversations();
  }, [isOpen, refreshConversations]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev) => {
      const next = !prev;
      if (!prev) {
        refreshConversations();
      }
      return next;
    });
  }, [refreshConversations]);

  const handleIncomingMessage = useCallback(
    (payload) => {
      if (!payload) return;
      appendMessage(payload);
      setConversations((prev) => {
        let found = false;
        const updated = prev.map((item) => {
          if (item.id === payload.conversationId) {
            found = true;
            return {
              ...item,
              lastMessageAt: payload.createdAt,
              updatedAt: payload.createdAt,
            };
          }
          return item;
        });
        if (!found) {
          refreshConversations();
        }
        return updated;
      });
      const belongsToActive = payload.conversationId === conversation?.id;
      if (!belongsToActive) {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === payload.conversationId
              ? { ...item, hasUnread: true }
              : item
          )
        );
      }
      if ((!isOpen || !belongsToActive) && payload.senderRole !== "user") {
        setUnreadCount((count) => count + 1);
      }
    },
    [appendMessage, conversation?.id, isOpen, refreshConversations]
  );

  const loadConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        return;
      }
      setInitializing(true);
      setError(null);
      try {
        const data = await SupportChatService.getMyConversationMessages(conversationId);
        setConversation(data.conversation);
        setMessages(data.messages.map(normalizeMessage));
        setConversations((prev) =>
          prev.map((item) =>
            item.id === data.conversation.id
              ? { ...item, ...data.conversation, hasUnread: false }
              : item
          )
        );
        setUnreadCount(0);
        setShowHistory(false);
      } catch (err) {
        const message = err?.response?.data?.message ?? err?.message ?? "Không mở được cuộc trò chuyện";
        setError(message);
      } finally {
        setInitializing(false);
      }
    },
    []
  );

  const handleDeleteConversation = useCallback(
    async (conversationId) => {
      if (!conversationId || deletingConversationId === conversationId) {
        return;
      }
      const confirmed = await toast.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?", { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
      if (!confirmed) {
        return;
      }
      setHistoryError(null);
      setDeletingConversationId(conversationId);
      try {
        await SupportChatService.deleteMyConversation(conversationId);
        setConversations((prev) => {
          const updated = prev.filter((item) => item.id !== conversationId);
          const unreadTotal = updated.reduce(
            (count, item) => (item.hasUnread ? count + 1 : count),
            0
          );
          setUnreadCount(unreadTotal);
          return updated;
        });
        if (conversation?.id === conversationId) {
          setConversation(null);
          setMessages([]);
          setError(null);
        }
        await refreshConversations();
      } catch (err) {
        const message = err?.response?.data?.message ?? err?.message ?? "Không xóa được cuộc trò chuyện";
        setHistoryError(message);
      } finally {
        setDeletingConversationId(null);
      }
    },
    [conversation?.id, deletingConversationId, refreshConversations, toast]
  );

  const handleCreateConversation = async () => {
    if (creating) {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const freshConversation = await SupportChatService.createConversation();
      setConversation(freshConversation);
      setMessages([]);
      setUnreadCount(0);
      hasLoadedSessionRef.current = true;
      setConversations((prev) => [
        { ...freshConversation, hasUnread: false },
        ...prev.filter((item) => item.id !== freshConversation.id),
      ]);
      setShowHistory(false);
      await refreshConversations();
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? "Không thể tạo cuộc trò chuyện mới";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = useCallback((payload) => {
    if (!payload) return;
    setConversation((current) => (current && current.id === payload.id ? payload : current));
  }, []);

  const fetchSession = useCallback(async () => {
    if (hasLoadedSessionRef.current) {
      return;
    }
    setInitializing(true);
    setError(null);
    try {
      const data = await SupportChatService.getSession();
      hasLoadedSessionRef.current = true;
      setConversation(data.conversation);
      setMessages(data.messages.map(normalizeMessage));
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? "Không thể tải cửa sổ hỗ trợ";
      setError(message);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setUnreadCount(0);
      return;
    }
    fetchSession();
  }, [fetchSession, isOpen]);

  useEffect(() => {
    if (!conversation?.id || !isOpen) {
      disconnectSocket();
      return;
    }

    const socket = ensureSocket();

    const onConnect = () => {
      socket.emit("join_conversation", { conversationId: conversation.id });
    };

    socket.on("connect", onConnect);
    socket.on("support_message", handleIncomingMessage);
    socket.on("support_status", handleStatusUpdate);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.emit("leave_conversation", { conversationId: conversation.id });
      socket.off("connect", onConnect);
      socket.off("support_message", handleIncomingMessage);
      socket.off("support_status", handleStatusUpdate);
      disconnectSocket();
    };
  }, [conversation?.id, disconnectSocket, ensureSocket, handleIncomingMessage, handleStatusUpdate, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages, isOpen]);

  const toggleWidget = () => {
    setIsOpen((value) => {
      const next = !value;
      if (!next) {
        setShowHistory(false);
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const result = await SupportChatService.sendUserMessage(text);
      if (result?.message) {
        appendMessage(result.message);
      }
      if (result?.conversation) {
        setConversation(result.conversation);
      }
      setInputValue("");
    } catch (err) {
      const message = err?.response?.data?.message ?? err?.message ?? "Không gửi được tin nhắn";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const statusLabel = useMemo(() => {
    const current = conversation?.status;
    if (!current) {
      return "";
    }
    return statusLabelMap[current] ?? "";
  }, [conversation?.status]);

  if (!isEnabled || isLoginRoute) {
    return null;
  }

  return (
    <div className={styles.widgetContainer}>
      {isOpen && (
        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelTitle}>Hỗ trợ trực tuyến</div>
              {statusLabel && <div className={styles.panelSubtitle}>{statusLabel}</div>}
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleToggleHistory}
                title={showHistory ? "Quay lại trò chuyện" : "Xem lịch sử hỗ trợ"}
                disabled={initializing || loadingConversations}
              >
                {showHistory ? "←" : "≡"}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={handleCreateConversation}
                disabled={initializing || creating}
                title="Bắt đầu cuộc trò chuyện mới"
              >
                +
              </button>
              <button type="button" className={styles.closeButton} onClick={toggleWidget}>
                ×
              </button>
            </div>
          </header>

          <div className={styles.panelBody}>
            {showHistory ? (
              <div className={styles.historyContainer}>
                <div className={styles.historyHeader}>
                  <div className={styles.historyTitle}>Lịch sử hỗ trợ</div>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={refreshConversations}
                    disabled={loadingConversations}
                    title="Tải lại danh sách"
                  >
                    ↻
                  </button>
                </div>
                {historyError ? (
                  <div className={styles.errorBox}>{historyError}</div>
                ) : loadingConversations && conversations.length === 0 ? (
                  <div className={styles.placeholder}>Đang tải lịch sử...</div>
                ) : conversations.length === 0 ? (
                  <div className={styles.placeholder}>Bạn chưa có cuộc trò chuyện nào</div>
                ) : (
                  <div className={styles.historyList}>
                    {conversations.map((item) => {
                      const isActive = conversation?.id === item.id;
                      const statusText = statusLabelMap[item.status] ?? "";
                      const timestamp = item.lastMessageAt || item.updatedAt || item.createdAt;
                      const isDeleting = deletingConversationId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`${styles.historyItem} ${isActive ? styles.historyItemActive : ""}`}
                        >
                          <button
                            type="button"
                            className={styles.historyOpenButton}
                            onClick={() => loadConversation(item.id)}
                            disabled={initializing || isDeleting}
                          >
                            <div className={styles.historyItemContent}>
                              <div className={styles.historyItemTitle}>
                                {item.subject || `Cuộc trò chuyện #${item.id}`}
                              </div>
                              <div className={styles.historyItemMeta}>
                                {formatDateTime(timestamp)}
                              </div>
                            </div>
                            <div className={styles.historyItemAside}>
                              {statusText && <span className={styles.historyStatus}>{statusText}</span>}
                              {item.hasUnread && <span className={styles.historyBadge}>Mới</span>}
                            </div>
                          </button>
                          <button
                            type="button"
                            className={styles.historyDeleteButton}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteConversation(item.id);
                            }}
                            disabled={isDeleting}
                            title="Xóa cuộc trò chuyện"
                          >
                            {isDeleting ? "…" : "✕"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : initializing ? (
              <div className={styles.placeholder}>Đang tải cuộc trò chuyện...</div>
            ) : error ? (
              <div className={styles.errorBox}>{error}</div>
            ) : (
              <div className={styles.messagesContainer}>
                {sortedMessages.map((message) => {
                  const isMine = message.senderRole === "user";
                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageRow} ${isMine ? styles.messageMine : styles.messageTheirs}`}
                    >
                      <div className={styles.bubble}>
                        <div className={styles.messageContent}>{message.content}</div>
                        <div className={styles.messageMeta}>{formatTime(message.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form className={styles.footer} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.input}
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={sending || initializing}
            />
            <button type="submit" className={styles.sendButton} disabled={sending || initializing}>
              Gửi
            </button>
          </form>
        </div>
      )}

      {!isAdminRoute && (
        <button type="button" className={styles.fab} onClick={toggleWidget}>
          <span>Trợ lý</span>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>
      )}
    </div>
  );
};

export default SupportChatWidget;
