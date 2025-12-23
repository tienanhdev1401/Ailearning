import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/AiChatExperience.module.css";
import AiChatService from "../../services/aiChatService";
import { createAiChatSocket } from "../../utils/aiChatSocket";
import AI_CONVERSATION_MODE from "../../enums/aiConversationMode.enum";

const modeLabels = {
  [AI_CONVERSATION_MODE.VOICE]: "Voice",
  [AI_CONVERSATION_MODE.TEXT]: "Text",
};

const defaultScores = [
  { key: "pronunciationScore", label: "Pronunciation" },
  { key: "prosodyScore", label: "Prosody" },
  { key: "grammarScore", label: "Grammar" },
  { key: "vocabularyScore", label: "Vocabulary" },
];

const initialCustomScenario = {
  title: "",
  description: "",
  prompt: "",
  language: "en",
  difficulty: "",
};

function parseEvaluationDetails(evaluation) {
  if (!evaluation?.rawDetails) return { suggestions: [] };
  try {
    const parsed = JSON.parse(evaluation.rawDetails);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (error) {
    return { suggestions: [] };
  }
}

const AiChatExperience = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [mode, setMode] = useState(AI_CONVERSATION_MODE.VOICE);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customScenario, setCustomScenario] = useState(initialCustomScenario);
  const [interviewIndustry, setInterviewIndustry] = useState("");
  const [loadingSpeechId, setLoadingSpeechId] = useState(null);
  const [playingSpeechId, setPlayingSpeechId] = useState(null);

  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const prevMessageCountRef = useRef(0);
  const speechCacheRef = useRef(new Map());
  const audioElementRef = useRef(null);
  const hasAutoplayedIntroRef = useRef(false);

  const formatMessageTime = useCallback((value) => {
    if (!value) {
      return "";
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    const hoChiMinhOffsetMs = 1 * 60 * 60 * 1000;
    const shiftedTimestamp = parsed.getTime() + hoChiMinhOffsetMs;
    const shifted = new Date(shiftedTimestamp);
    const hours = shifted.getUTCHours().toString().padStart(2, "0");
    const minutes = shifted.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const recomputeAutoScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    shouldAutoScrollRef.current = distanceFromBottom <= 120;
  }, []);

  const selectedScenario = useMemo(
    () => scenarios.find((item) => item.id === selectedScenarioId) ?? null,
    [scenarios, selectedScenarioId]
  );

  const isJobInterview = useMemo(() => {
    const scenarioText = `${selectedScenario?.title ?? ""} ${selectedScenario?.description ?? ""}`
      .toLowerCase()
      .trim();
    if (!scenarioText) {
      return false;
    }
    return scenarioText.includes("interview") || scenarioText.includes("phỏng vấn");
  }, [selectedScenario]);

  const trimmedInterviewIndustry = useMemo(() => interviewIndustry.trim(), [interviewIndustry]);
  const isInterviewIndustryMissing = isJobInterview && trimmedInterviewIndustry.length === 0;
  const isConversationActive = conversation && conversation.status === "active";
  const startDisabled = loading || isConversationActive || isInterviewIndustryMissing;
  const sendDisabled = !isConversationActive || isSendingText || isUploadingAudio;
  const micDisabled = !isConversationActive || isUploadingAudio;
  const contextInputClassName = `${styles.contextInput} ${
    isInterviewIndustryMissing ? styles.contextInputError : ""
  }`;

  const getMessageKey = useCallback((message) => {
    if (!message) {
      return "";
    }
    if (message.id !== undefined && message.id !== null) {
      return String(message.id);
    }
    if (message.createdAt) {
      return String(message.createdAt);
    }
    const fallback = message.content ?? message.transcript ?? "unknown";
    return `${message.role ?? "unknown"}-${fallback.slice(0, 24)}`;
  }, []);

  const resetSpeechState = useCallback(() => {
    speechCacheRef.current = new Map();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setPlayingSpeechId(null);
    setLoadingSpeechId(null);
    hasAutoplayedIntroRef.current = false;
  }, []);

  const pushSystemMessage = useCallback((text) => {
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: "system",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const ensureSpeechUrl = useCallback(
    async (message, options = {}) => {
      const { silent = false } = options;
      if (!message) {
        return null;
      }
      const key = getMessageKey(message);
      const cache = speechCacheRef.current;
      if (cache.has(key)) {
        return cache.get(key);
      }

      const text = (message.transcript || message.content || "").trim();
      if (!text) {
        if (!silent) {
          pushSystemMessage("Tin nhắn này chưa có nội dung để phát lại.");
        }
        return null;
      }

      setLoadingSpeechId(key);
      try {
        const result = await AiChatService.synthesizeSpeech(text);
        const audioUrl = `data:${result.mimeType};base64,${result.audioBase64}`;
        cache.set(key, audioUrl);
        return audioUrl;
      } catch (error) {
        const messageText = error?.response?.data?.message ?? error?.message ?? "Không tạo được âm thanh cho đoạn hội thoại này.";
        if (!silent) {
          pushSystemMessage(messageText);
        }
        console.error("Speech synthesis failed", error);
        return null;
      } finally {
        setLoadingSpeechId((current) => (current === key ? null : current));
      }
    },
    [getMessageKey, pushSystemMessage]
  );

  const playMessageAudio = useCallback(
    async (message, options = {}) => {
      const { auto = false } = options;
      if (!message) {
        return;
      }

      const key = getMessageKey(message);

      try {
        const audioUrl = await ensureSpeechUrl(message, { silent: auto });
        if (!audioUrl) {
          return;
        }

        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current = null;
        }

        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        setPlayingSpeechId(key);

        audio.onended = () => {
          if (audioElementRef.current === audio) {
            audioElementRef.current = null;
          }
          setPlayingSpeechId((current) => (current === key ? null : current));
        };

        audio.onerror = () => {
          if (audioElementRef.current === audio) {
            audioElementRef.current = null;
          }
          setPlayingSpeechId((current) => (current === key ? null : current));
          if (!auto) {
            pushSystemMessage("Không phát được âm thanh. Bạn hãy thử lại nhé.");
          }
        };

        try {
          await audio.play();
        } catch (error) {
          if (audioElementRef.current === audio) {
            audioElementRef.current = null;
          }
          setPlayingSpeechId((current) => (current === key ? null : current));
          if (!auto) {
            const notice = error?.message?.toLowerCase().includes("play")
              ? "Trình duyệt đang chặn phát tự động. Nhấn vào biểu tượng loa để nghe lại."
              : "Không phát được âm thanh. Bạn hãy thử lại nhé.";
            pushSystemMessage(notice);
          } else {
            console.warn("Auto playback was blocked", error);
          }
        }
      } catch (error) {
        console.error("Play speech failed", error);
        if (!auto) {
          pushSystemMessage("Không phát được âm thanh. Bạn hãy thử lại nhé.");
        }
      }
    },
    [ensureSpeechUrl, getMessageKey, pushSystemMessage]
  );

  useEffect(() => {
    if (!isJobInterview) {
      setInterviewIndustry("");
    }
  }, [isJobInterview]);

  useEffect(() => {
    if (!conversation || conversation.status !== "active") {
      return;
    }

    if (hasAutoplayedIntroRef.current) {
      return;
    }

    const firstAiMessage = messages.find((msg) => msg.role === "ai");
    if (!firstAiMessage) {
      return;
    }

    const hasUserMessages = messages.some((msg) => msg.role === "user");
    if (hasUserMessages) {
      hasAutoplayedIntroRef.current = true;
      return;
    }

    hasAutoplayedIntroRef.current = true;
    playMessageAudio(firstAiMessage, { auto: true }).catch((error) => {
      console.warn("Auto speech playback failed", error);
    });
  }, [conversation, messages, playMessageAudio]);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await AiChatService.fetchScenarios();
        setScenarios(data);
        if (data.length && !selectedScenarioId) {
          setSelectedScenarioId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load scenarios", error);
        const message = "Không tải được danh sách kịch bản. Vui lòng thử lại.";
        pushSystemMessage(message);
      }
    };
    loadScenarios();
  }, [selectedScenarioId, pushSystemMessage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      recomputeAutoScroll();
    };

    container.addEventListener("scroll", handleScroll);
    recomputeAutoScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [recomputeAutoScroll]);

  const scrollMessagesToBottom = useCallback((behavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const currentCount = messages.length;
    const previousCount = prevMessageCountRef.current;
    const hasNewMessage = currentCount > previousCount;

    if (hasNewMessage && shouldAutoScrollRef.current) {
      const behavior = previousCount <= 1 ? "auto" : "smooth";
      scrollMessagesToBottom(behavior);
      shouldAutoScrollRef.current = true;
    }

    prevMessageCountRef.current = currentCount;
    recomputeAutoScroll();
  }, [messages, recomputeAutoScroll, scrollMessagesToBottom]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const connectSocket = useCallback((conversationId) => {
    if (!conversationId) return;

    if (!socketRef.current) {
      socketRef.current = createAiChatSocket();
    }
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    const handleUserMessage = (payload) => {
      setMessages((prev) => upsertMessage(prev, payload));
    };

    const handleAiMessage = (payload) => {
      setMessages((prev) => upsertMessage(prev, payload));
    };

    const handleEvaluation = (payload) => {
      setEvaluation(payload);
    };

    const handleTranscript = ({ text, messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, transcriptLive: text } : msg
        )
      );
    };

    socket.emit("join_session", { conversationId });
    socket.on("user_message", handleUserMessage);
    socket.on("ai_message", handleAiMessage);
    socket.on("evaluation_update", handleEvaluation);
    socket.on("transcript", handleTranscript);

    return () => {
      socket.off("user_message", handleUserMessage);
      socket.off("ai_message", handleAiMessage);
      socket.off("evaluation_update", handleEvaluation);
      socket.off("transcript", handleTranscript);
      socket.emit("leave_session", { conversationId });
    };
  }, []);

  useEffect(() => {
    if (!conversation?.id) {
      return () => undefined;
    }

    const cleanup = connectSocket(conversation.id);
    return () => {
      cleanup?.();
    };
  }, [conversation?.id, connectSocket]);

  const upsertMessage = (current, incoming) => {
    if (!incoming) return current;
    const next = [...current];
    const index = next.findIndex((msg) => msg.id === incoming.id);
    if (index !== -1) {
      next[index] = { ...next[index], ...incoming };
      return next;
    }

    const createdAt = new Date(incoming.createdAt).getTime();
    const last = next[next.length - 1];
    if (!last || createdAt >= new Date(last.createdAt).getTime()) {
      next.push(incoming);
      return next;
    }

    const insertIndex = next.findIndex(
      (item) => new Date(item.createdAt).getTime() > createdAt
    );
    if (insertIndex === -1) {
      next.push(incoming);
    } else {
      next.splice(insertIndex, 0, incoming);
    }
    return next;
  };

  const handleStart = async () => {
    if (loading || isConversationActive) return;
    if (!selectedScenarioId && !customScenario.prompt) {
      const message = "Bạn cần chọn hoặc tạo một kịch bản trước.";
      pushSystemMessage(message);
      return;
    }

    if (isJobInterview && !trimmedInterviewIndustry) {
      return;
    }

    resetSpeechState();
    setConversation(null);
    setMessages([]);
    setEvaluation(null);
    setLoading(true);

    try {
      const payload = {
        mode,
      };

      if (selectedScenarioId) {
        payload.scenarioId = selectedScenarioId;

        if (isJobInterview && trimmedInterviewIndustry) {
          payload.scenarioContext = `The candidate is interviewing for a role in the ${trimmedInterviewIndustry} industry. Tailor every question, follow-up, and piece of feedback to scenarios that commonly appear in this field.`;
          payload.scenarioContextLabel = `${trimmedInterviewIndustry} industry`;
        } else if (selectedScenario?.title) {
          payload.scenarioContextLabel = selectedScenario.title;
        }
      } else {
        payload.customPrompt = customScenario.prompt;
        payload.customTitle = customScenario.title || "Tình huống của tôi";
      }

      const data = await AiChatService.startSession(payload);
      setConversation(data.conversation);
      const existingMessages = [...(data.conversation.messages ?? [])];
      if (
        data.openingMessage &&
        !existingMessages.some((msg) => msg.id === data.openingMessage.id)
      ) {
        existingMessages.push(data.openingMessage);
      }
      const initialMessages = existingMessages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(initialMessages);
      setEvaluation(data.conversation.evaluation ?? null);
    } catch (error) {
      console.error("Failed to start session", error);
      const message = error.response?.data?.message ?? "Không thể bắt đầu phiên trò chuyện";
      pushSystemMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!conversation?.id || !textMessage.trim()) return;

    setIsSendingText(true);
    try {
      const result = await AiChatService.sendTextMessage(conversation.id, textMessage.trim());
      setMessages((prev) => {
        const next = upsertMessage(prev, result.userMessage);
        return upsertMessage(next, result.aiMessage);
      });
      if (result.evaluation) {
        setEvaluation(result.evaluation);
      }
      setTextMessage("");
    } catch (error) {
      console.error("Send message failed", error);
      const message = error.response?.data?.message ?? "Không thể gửi tin nhắn";
      pushSystemMessage(message);
    } finally {
      setIsSendingText(false);
    }
  };

  const startRecording = async () => {
    if (!conversation?.id) {
      const message = "Hãy bắt đầu phiên trước khi thu âm.";
      pushSystemMessage(message);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          setIsRecording(false);
          pushSystemMessage("Bạn giữ nút quá nhanh nên chưa kịp thu âm. Hãy thử giữ lâu hơn một chút nhé.");
          return;
        }
        const file = new File([blob], `ai-chat-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setIsUploadingAudio(true);
        try {
          const result = await AiChatService.sendAudioMessage(conversation.id, file);
          setMessages((prev) => {
            const next = upsertMessage(prev, result.userMessage);
            return upsertMessage(next, result.aiMessage);
          });
          if (result.evaluation) {
            setEvaluation(result.evaluation);
          }
        } catch (error) {
          console.error("Audio upload failed", error);
          const message = error.response?.data?.message ?? "Không thể xử lý giọng nói";
          pushSystemMessage(message);
        } finally {
          setIsUploadingAudio(false);
          setIsRecording(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error", error);
      const message = "Không thể truy cập micro. Hãy kiểm tra quyền trình duyệt.";
      pushSystemMessage(message);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleCompleteSession = async () => {
    if (!conversation?.id) return;
    try {
      const result = await AiChatService.completeSession(conversation.id);
      if (result.evaluation) {
        setEvaluation(result.evaluation);
      }
      setConversation((prev) => (prev ? { ...prev, status: "completed" } : prev));
    } catch (error) {
      console.error("Complete session failed", error);
      const message = "Không thể kết thúc phiên. Thử lại sau.";
      pushSystemMessage(message);
    }
  };

  const handleDownloadAudio = async () => {
    if (!conversation?.id) return;
    try {
      const blob = await AiChatService.downloadAudioArchive(conversation.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-session-${conversation.id}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      const message = "Không tải được tệp âm thanh. Phiên chưa có bản ghi?";
      pushSystemMessage(message);
    }
  };

  const handleCreateScenario = async () => {
    if (!customScenario.title || !customScenario.prompt) {
      const message = "Vui lòng nhập tiêu đề và mô tả tình huống.";
      pushSystemMessage(message);
      return;
    }
    try {
      const scenario = await AiChatService.createScenario(customScenario);
      setScenarios((prev) => [scenario, ...prev]);
      setSelectedScenarioId(scenario.id);
      setShowModal(false);
      setCustomScenario(initialCustomScenario);
    } catch (error) {
      console.error("Create scenario failed", error);
      const message = error.response?.data?.message ?? "Không thể tạo kịch bản";
      pushSystemMessage(message);
    }
  };

  const renderMessage = (message) => {
    if (message.role === "system") {
      return (
        <div key={message.id} className={`${styles.messageRow} ${styles.system}`}>
          <div className={styles.systemBubble}>{message.content}</div>
          <div className={styles.messageMeta}>
            {formatMessageTime(message.createdAt)}
          </div>
        </div>
      );
    }

    const isUser = message.role === "user";
    const textContent = message.transcript || message.content || message.transcriptLive || "";
    const displayText = textContent || "";
    const messageKey = getMessageKey(message);
    const isLoadingSpeech = loadingSpeechId === messageKey;
    const isPlayingSpeech = playingSpeechId === messageKey;
    const canReplaySpeech = Boolean(displayText.trim()) && typeof playMessageAudio === "function";

    return (
      <div
        key={message.id ?? messageKey}
        className={`${styles.messageRow} ${isUser ? styles.user : ""}`}
      >
        <div className={styles.messageBubble}>
          <div className={styles.messageBubbleContent}>
            <span className={styles.messageText}>{displayText}</span>
            {canReplaySpeech && (
              <button
                type="button"
                className={`${styles.speechButton} ${
                  isPlayingSpeech ? styles.speechButtonActive : ""
                }`}
                onClick={() => playMessageAudio(message)}
                disabled={isLoadingSpeech}
                aria-label="Nghe lại tin nhắn này"
              >
                {isLoadingSpeech ? "…" : isPlayingSpeech ? "🔈" : "🔊"}
              </button>
            )}
          </div>
        </div>
        <div className={styles.messageMeta}>
          {isUser ? "Bạn" : "AelanG AI"} · {formatMessageTime(message.createdAt)}
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    if (!evaluation) return null;
    const { suggestions } = parseEvaluationDetails(evaluation);

    return (
      <div className={styles.evaluationPanel}>
        {defaultScores.map((metric) => {
          const value = evaluation[metric.key] ?? 0;
          const percent = Math.min(100, Math.round((value / 10) * 100));
          return (
            <div key={metric.key} className={styles.scoreRow}>
              <div>{metric.label}</div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${percent}%` }} />
              </div>
              <div>{value?.toFixed ? value.toFixed(1) : value}/10</div>
            </div>
          );
        })}
        {evaluation.summary && <div className={styles.summaryBox}>{evaluation.summary}</div>}
        {suggestions.length > 0 && (
          <div className={styles.summaryBox}>
            <strong>Gợi ý cải thiện:</strong>
            <ul>
              {suggestions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>Trò chuyện cùng AelanG AI</h1>
          <p>
            Chọn một kịch bản, nhập vai với AI và nhận phản hồi tức thì về phát âm, ngữ điệu,
            ngữ pháp và từ vựng. Bạn có thể thu âm trực tiếp hoặc gõ tin nhắn tùy thích.
          </p>
        </div>
        <div className={styles.modeToggle}>
          {Object.values(AI_CONVERSATION_MODE).map((itemMode) => (
            <button
              key={itemMode}
              className={`${styles.modeButton} ${mode === itemMode ? styles.active : ""}`}
              onClick={() => setMode(itemMode)}
            >
              {modeLabels[itemMode]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.scenarioPanel}>
          <div className={styles.scenarioHeader}>
            <h2>Tình huống</h2>
            <button
              className={styles.addScenarioButton}
              onClick={() => setShowModal(true)}
            >
              + Tạo tình huống
            </button>
          </div>
          <div className={styles.scenarioGrid}>
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`${styles.scenarioCard} ${
                  selectedScenarioId === scenario.id ? styles.active : ""
                }`}
                onClick={() => setSelectedScenarioId(scenario.id)}
              >
                <div className={styles.scenarioTitle}>{scenario.title}</div>
                <p className={styles.scenarioDesc}>{scenario.description}</p>
              </div>
            ))}
          </div>
          {isJobInterview && (
            <div className={styles.contextField}>
              <label htmlFor="interviewIndustry">
                Ngành phỏng vấn
                <span className={styles.contextOptional}>(Bắt buộc)</span>
              </label>
              <input
                id="interviewIndustry"
                className={contextInputClassName}
                placeholder="Ví dụ: Công nghệ tài chính, giáo dục, bán lẻ..."
                value={interviewIndustry}
                onChange={(event) => setInterviewIndustry(event.target.value)}
                autoComplete="off"
              />
              <p className={styles.contextHelp}>
                AI sẽ điều chỉnh câu hỏi và phản hồi dựa trên lĩnh vực bạn nhập.
              </p>
              {isInterviewIndustryMissing && (
                <p className={styles.contextError}>
                  Vui lòng nhập ngành nghề trước khi bắt đầu buổi phỏng vấn.
                </p>
              )}
            </div>
          )}
          <button
            className={styles.startButton}
            onClick={handleStart}
            disabled={startDisabled}
          >
            {loading
              ? "Đang khởi tạo..."
              : conversation?.status === "active"
              ? "Đang trò chuyện"
              : "Bắt đầu nhập vai"}
          </button>
        </aside>

        <section className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <h2>{conversation?.customTitle || conversation?.scenario?.title || "Chưa có phiên"}</h2>
            <div className={styles.sessionStatus}>
              {conversation ? (conversation.status === "completed" ? "Đã kết thúc" : "Đang diễn ra") : "Chưa bắt đầu"}
            </div>
          </div>

          <div className={styles.messages} ref={messagesContainerRef}>
            {messages.map((message) => renderMessage(message))}
          </div>

          {mode === AI_CONVERSATION_MODE.TEXT && (
            <div className={styles.inputArea}>
              <input
                className={styles.textInput}
                placeholder="Nhập tin nhắn..."
                value={textMessage}
                onChange={(event) => setTextMessage(event.target.value)}
                disabled={!conversation || conversation.status === "completed"}
              />
              <button
                className={styles.sendButton}
                onClick={handleSendText}
                disabled={sendDisabled}
              >
                Gửi
              </button>
            </div>
          )}

          {mode === AI_CONVERSATION_MODE.VOICE && (
            <div className={styles.voiceDock}>
              <button
                className={styles.dockAction}
                onClick={handleCompleteSession}
                disabled={!conversation || conversation.status !== "active"}
              >
                End role-play
              </button>

              <button
                className={`${styles.micButton} ${isRecording ? styles.recording : ""}`}
                onMouseDown={!micDisabled ? startRecording : undefined}
                onMouseUp={!micDisabled ? stopRecording : undefined}
                onMouseLeave={isRecording ? stopRecording : undefined}
                onTouchStart={!micDisabled
                  ? ((event) => {
                      event.preventDefault();
                      startRecording();
                    })
                  : undefined}
                onTouchEnd={!micDisabled
                  ? ((event) => {
                      event.preventDefault();
                      stopRecording();
                    })
                  : undefined}
                onTouchCancel={!micDisabled ? stopRecording : undefined}
                disabled={micDisabled}
                aria-pressed={isRecording}
                aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
              >
                <span className={styles.micIcon} />
              </button>

              <div className={styles.dockSideActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => setMode(AI_CONVERSATION_MODE.TEXT)}
                  disabled={!conversation}
                  title="Chuyển sang nhập text"
                >
                  ⌨
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setShowModal(true)}
                  title="Gợi ý tình huống"
                >
                  💡
                </button>
              </div>
              {isRecording && <span className={styles.recIndicator}>Đang ghi...</span>}
            </div>
          )}

          {renderEvaluation()}

          <div className={styles.actions}>
            <button
              className={styles.endButton}
              onClick={handleCompleteSession}
              disabled={!conversation || conversation.status === "completed"}
            >
              Kết thúc phiên
            </button>
            <button
              className={styles.downloadButton}
              onClick={handleDownloadAudio}
              disabled={!conversation}
            >
              Tải bản ghi
            </button>
          </div>
        </section>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Tạo tình huống của bạn</h3>
            <input
              placeholder="Tiêu đề"
              value={customScenario.title}
              onChange={(event) =>
                setCustomScenario({ ...customScenario, title: event.target.value })
              }
            />
            <textarea
              placeholder="Mô tả ngắn"
              value={customScenario.description}
              onChange={(event) =>
                setCustomScenario({ ...customScenario, description: event.target.value })
              }
            />
            <textarea
              placeholder="Hướng dẫn chi tiết cho AI"
              value={customScenario.prompt}
              onChange={(event) =>
                setCustomScenario({ ...customScenario, prompt: event.target.value })
              }
            />
            <div className={styles.modalActions}>
              <button className={styles.cancel} onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className={styles.confirm} onClick={handleCreateScenario}>
                Lưu tình huống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatExperience;
