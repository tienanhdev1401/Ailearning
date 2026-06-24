import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/AiChatExperience.module.css";
import AiChatService from "../../services/aiChatService";
import ConversationHistorySidebar from "../components/ConversationHistorySidebar";
import userService from "../../services/userService";
import api from "../../api/api";
import { createAiChatSocket } from "../../utils/aiChatSocket";
import { convertBlobToWav16k } from "../../utils/audioToWav";
import AI_CONVERSATION_MODE from "../../enums/aiConversationMode.enum";
import CreditBanner from "../components/CreditBanner";
import useCurrentUser from "../hooks/useCurrentUser";
import { useNavigate } from "react-router-dom";

const SpeakerIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
    />
  </svg>
);

const SpeakerPlayingIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    width={size}
    height={size}
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
    />
  </svg>
);

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

const DIFFICULTY_LEVELS = [
  { value: "novice", label: "Lính mới", desc: "Từ vựng đơn giản, câu ngắn" },
  { value: "intermediate", label: "Tập sự", desc: "Giao tiếp hàng ngày" },
  { value: "advanced", label: "Chiến binh", desc: "Nâng cao, đa dạng" },
  { value: "superior", label: "Cao thủ", desc: "Phức tạp, chuyên sâu" },
  { value: "expert", label: "Người bản xứ", desc: "Tự nhiên như native" },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1.0, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
];

const ROADMAP_DIFFICULTY_RULES = [
  { level: "novice", keywords: ["zero", "beginner", "starter", "newbie", "a1", "300"] },
  { level: "intermediate", keywords: ["intermediate", "basic", "a2", "b1", "450", "500", "600"] },
  { level: "advanced", keywords: ["advanced", "b2", "700", "750", "800"] },
  { level: "superior", keywords: ["superior", "c1", "850", "900"] },
  { level: "expert", keywords: ["expert", "native", "c2", "950", "990"] },
];

const normalizeForDifficulty = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const inferDifficultyFromRoadmap = (roadmap) => {
  const source = normalizeForDifficulty(
    [
      roadmap?.displayName,
      roadmap?.title,
      roadmap?.levelName,
      roadmap?.description,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (!source) return null;

  const matchedRule = ROADMAP_DIFFICULTY_RULES.find((rule) =>
    rule.keywords.some((keyword) => source.includes(keyword))
  );

  return matchedRule?.level ?? null;
};

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
  const { userId } = useCurrentUser();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
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
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [credits, setCredits] = useState(null);
  const [difficultyLevel, setDifficultyLevel] = useState("intermediate");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [suggestedDifficulty, setSuggestedDifficulty] = useState(null);
  const [suggestedRoadmapName, setSuggestedRoadmapName] = useState(null);
  const [suggestedRoadmapId, setSuggestedRoadmapId] = useState(null);
  const [suggestedRoadmapPercent, setSuggestedRoadmapPercent] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const speedMenuRef = useRef(null);
  const difficultyTouchedRef = useRef(false);
  const tooltipRef = useRef(null);

  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const prevMessageCountRef = useRef(0);
  const speechCacheRef = useRef(new Map());
  const audioElementRef = useRef(null);
  const hasAutoplayedIntroRef = useRef(false);
  const streamRef = useRef(null);
  const lastPlayedAiMessageIdRef = useRef(null);

  const formatMessageTime = useCallback((value) => {
    if (!value) {
      return "";
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(parsed);
    } catch {
      const hours = parsed.getHours().toString().padStart(2, "0");
      const minutes = parsed.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    }
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

  const selectedDifficultyMeta = useMemo(
    () => DIFFICULTY_LEVELS.find((level) => level.value === difficultyLevel) ?? DIFFICULTY_LEVELS[1],
    [difficultyLevel]
  );

  const isAiSuggested = useMemo(
    () => suggestedDifficulty !== null && suggestedDifficulty !== undefined && difficultyLevel === suggestedDifficulty,
    [suggestedDifficulty, difficultyLevel]
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
  // A session opened from history is always read-only, even if its stored
  // status is still "active" (e.g. an abandoned session that was never
  // completed). This keeps the input/mic disabled while reviewing history.
  const isConversationActive =
    !viewingHistoryId && conversation && conversation.status === "active";
  const isCreditsExhausted = credits && (credits.aiConversationCredits ?? 0) <= 0;
  const startDisabled = loading || isConversationActive || isInterviewIndustryMissing || isCreditsExhausted;
  const sendDisabled = !isConversationActive || isSendingText || isUploadingAudio;
  const micDisabled = !isConversationActive || isUploadingAudio;
  const contextInputClassName = `${styles.contextInput} ${isInterviewIndustryMissing ? styles.contextInputError : ""
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
    lastPlayedAiMessageIdRef.current = null;
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

      // User messages: play back the original recording, never TTS.
      if (message.role === "user") {
        if (message.audioPath) {
          cache.set(key, message.audioPath);
          return message.audioPath;
        }
        // No recording available for this user message — do nothing.
        if (!silent) {
          pushSystemMessage("Tin nhắn này không có bản ghi âm gốc để phát lại.");
        }
        return null;
      }

      // AI messages: synthesize via TTS.
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
        audio.playbackRate = playbackSpeed;
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
    [ensureSpeechUrl, getMessageKey, pushSystemMessage, playbackSpeed]
  );

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSpeedMenu]);

  // Close difficulty recommendation tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

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
    const key = getMessageKey(firstAiMessage);
    lastPlayedAiMessageIdRef.current = key;
    playMessageAudio(firstAiMessage, { auto: true }).catch((error) => {
      console.warn("Auto speech playback failed", error);
    });
  }, [conversation, messages, playMessageAudio, getMessageKey]);

  useEffect(() => {
    if (!conversation || conversation.status !== "active") {
      return;
    }

    if (mode !== AI_CONVERSATION_MODE.VOICE) {
      return;
    }

    const aiMessages = messages.filter((msg) => msg.role === "ai");
    if (aiMessages.length === 0) {
      return;
    }

    const latestAiMessage = aiMessages[aiMessages.length - 1];
    const key = getMessageKey(latestAiMessage);

    if (lastPlayedAiMessageIdRef.current !== key) {
      lastPlayedAiMessageIdRef.current = key;
      hasAutoplayedIntroRef.current = true;
      playMessageAudio(latestAiMessage, { auto: true }).catch((error) => {
        console.warn("Auto speech playback failed", error);
      });
    }
  }, [conversation, messages, mode, playMessageAudio, getMessageKey]);

  const fetchCredits = useCallback(async () => {
    try {
      const data = await userService.getCredits();
      setCredits(data);
    } catch (error) {
      console.error("Failed to fetch credits", error);
    }
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    if (!userId) {
      setSuggestedDifficulty(null);
      setSuggestedRoadmapName(null);
      setSuggestedRoadmapId(null);
      setSuggestedRoadmapPercent(0);
      return;
    }

    let cancelled = false;

    const loadActiveRoadmapDifficulty = async () => {
      try {
        const response = await api.get(`/roadmap_enrollments/user/${userId}/active`);
        if (cancelled) return;

        const payload = response.data ?? {};
        const roadmap =
          payload.roadmap ||
          payload.enrollment?.roadmap ||
          payload.roadmap_enrollement?.roadmap ||
          null;
        const inferredDifficulty = inferDifficultyFromRoadmap(roadmap);
        const roadmapName =
          roadmap?.displayName ||
          roadmap?.title ||
          roadmap?.levelName ||
          null;
        const roadmapId = roadmap?.id || null;

        const summary = payload.progressSummary || payload.progress_summary || {};
        const totalDays =
          Number(summary.totalDays) ||
          roadmap?.totalDays ||
          roadmap?.days?.length ||
          0;
        const completedDays = Number(summary.lastCompletedDay) || 0;
        const percent = totalDays > 0 ? Math.min(100, Math.round((completedDays / totalDays) * 100)) : 0;

        setSuggestedDifficulty(inferredDifficulty);
        setSuggestedRoadmapName(roadmapName);
        setSuggestedRoadmapId(roadmapId);
        setSuggestedRoadmapPercent(percent);

        if (inferredDifficulty && !difficultyTouchedRef.current && !isConversationActive) {
          setDifficultyLevel(inferredDifficulty);
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestedDifficulty(null);
          setSuggestedRoadmapName(null);
          setSuggestedRoadmapId(null);
          setSuggestedRoadmapPercent(0);
          console.warn("Failed to load active roadmap for AI chat difficulty", error);
        }
      }
    };

    loadActiveRoadmapDifficulty();

    return () => {
      cancelled = true;
    };
  }, [userId, isConversationActive]);

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

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
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
        difficultyLevel,
        learnerRoadmapName: suggestedRoadmapName || undefined,
        difficultySource: suggestedDifficulty === difficultyLevel ? "roadmap" : "manual",
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
      fetchCredits();
    } catch (error) {
      console.error("Failed to start session", error);
      if (error.response?.status === 402) {
        fetchCredits();
      }
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
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          setIsRecording(false);
          pushSystemMessage("Bạn giữ nút quá nhanh nên chưa kịp thu âm. Hãy thử giữ lâu hơn một chút nhé.");
          return;
        }
        setIsUploadingAudio(true);
        try {
          let file;
          try {
            file = await convertBlobToWav16k(blob, `ai-chat-${Date.now()}.wav`);
          } catch (conversionError) {
            console.error("WAV conversion failed", conversionError);
            pushSystemMessage("Trình duyệt chưa chuyển được bản ghi sang định dạng WAV. Bạn hãy thử lại nhé.");
            setIsUploadingAudio(false);
            setIsRecording(false);
            return;
          }
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Open a past conversation read-only: tear down any live session state
  // (socket, recording, playback) then load the stored transcript. Because
  // the loaded session is not "active", the input controls stay disabled.
  const handleOpenHistorySession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      stopRecording();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      resetSpeechState();
      setEvaluation(null);
      setViewingHistoryId(sessionId);
      try {
        const data = await AiChatService.getHistory(sessionId);
        setConversation(data);
        setMessages(
          [...(data.messages ?? [])].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        );
        setEvaluation(data.evaluation ?? null);
        setShowHistory(false);
      } catch (error) {
        console.error("Failed to open history session", error);
        pushSystemMessage("Không tải được cuộc trò chuyện này.");
        setViewingHistoryId(null);
      }
    },
    [resetSpeechState, pushSystemMessage]
  );

  // Reset back to a fresh "new conversation" state from history view.
  const handleNewConversation = useCallback(() => {
    resetSpeechState();
    setViewingHistoryId(null);
    setConversation(null);
    setMessages([]);
    setEvaluation(null);
  }, [resetSpeechState]);

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      // eslint-disable-next-line no-restricted-globals
      const confirmed = window.confirm("Bạn có chắc muốn xóa cuộc trò chuyện này? Thao tác này không thể hoàn tác.");
      if (!confirmed) return;
      try {
        await AiChatService.deleteSession(sessionId);
        // If the deleted session is the one being viewed, reset the view.
        if (viewingHistoryId === sessionId) {
          handleNewConversation();
        }
        pushSystemMessage("Đã xóa cuộc trò chuyện thành công.");
      } catch (error) {
        console.error("Delete session failed", error);
        pushSystemMessage("Không thể xóa cuộc trò chuyện. Vui lòng thử lại.");
      }
    },
    [viewingHistoryId, handleNewConversation, pushSystemMessage]
  );

  const handleCompleteSession = async () => {
    if (!conversation?.id || isFinalizing) return;
    setIsFinalizing(true);
    pushSystemMessage("Đang phân tích phát âm và tổng kết buổi học. Việc này có thể mất ít giây...");
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
    } finally {
      setIsFinalizing(false);
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
    // Disable speech for this message when any other message is currently playing or loading.
    const isSpeechBusy = Boolean(playingSpeechId || loadingSpeechId);
    const canShowSpeechButton = isUser
      ? Boolean(message.audioPath)
      : Boolean(displayText.trim());
    const speechDisabled = isLoadingSpeech || (isSpeechBusy && !isPlayingSpeech);

    return (
      <div
        key={message.id ?? messageKey}
        className={`${styles.messageRow} ${isUser ? styles.user : ""}`}
      >
        <div className={styles.messageBubble}>
          <div className={styles.messageBubbleContent}>
            <span className={styles.messageText}>{displayText}</span>
            {canShowSpeechButton && (
              <button
                type="button"
                className={`${styles.speechButton} ${isPlayingSpeech ? styles.speechButtonActive : ""
                  } ${speechDisabled ? styles.speechButtonDisabled : ""}`}
                onClick={() => playMessageAudio(message)}
                disabled={speechDisabled}
                aria-label="Nghe lại tin nhắn này"
              >
                {isLoadingSpeech ? "…" : isPlayingSpeech ? <SpeakerPlayingIcon size={15} /> : <SpeakerIcon size={15} />}
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

  const bandFromScore100 = (score) => {
    if (typeof score !== "number" || Number.isNaN(score)) return null;
    if (score >= 80) return "bandGood";
    if (score >= 56) return "bandMedium";
    return "bandWeak";
  };

  const ringColorFor = (score) => {
    const band = bandFromScore100(score);
    if (band === "bandGood") return "#22c55e";
    if (band === "bandMedium") return "#f59e0b";
    if (band === "bandWeak") return "#ef4444";
    return "#2dd4bf";
  };

  const renderScoreRing = (score) => {
    const safe = typeof score === "number" && !Number.isNaN(score) ? score : 0;
    const clamped = Math.max(0, Math.min(100, safe));
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped / 100);
    const color = ringColorFor(score);

    return (
      <div className={styles.reportRing} style={{ "--ring-color": color }}>
        <svg viewBox="0 0 140 140">
          <circle className={styles.reportRingTrack} cx="70" cy="70" r={radius} />
          <circle
            className={styles.reportRingProgress}
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className={styles.reportRingCenter}>
          <div className={styles.reportRingValue}>
            {typeof score === "number" ? Math.round(score) : "--"}
          </div>
          <div className={styles.reportRingMax}>/ 100</div>
        </div>
      </div>
    );
  };

  const renderPronunciationReport = () => {
    const report = evaluation?.pronunciationReport;
    if (!report) return null;

    if (report.status === "skipped") {
      const skippedNotice =
        report.reason === "no_user_audio"
          ? "Chưa có bản ghi giọng nói nào trong phiên này nên chưa thể phân tích phát âm."
          : "Chưa thể tạo phân tích phát âm cho phiên này.";
      return (
        <div className={styles.reportCard}>
          <div className={styles.reportNotice}>
            <div className={styles.reportNoticeIcon}>i</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--pp-text-strong)" }}>
                Phân tích phát âm
              </div>
              <div style={{ marginTop: 4 }}>{skippedNotice}</div>
            </div>
          </div>
        </div>
      );
    }

    if (report.status === "failed") {
      return (
        <div className={styles.reportCard}>
          <div className={styles.reportNotice}>
            <div className={styles.reportNoticeIcon}>!</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--pp-text-strong)" }}>
                Phân tích phát âm tạm thời chưa khả dụng
              </div>
              <div style={{ marginTop: 4 }}>
                Không kết nối được tới mô hình chấm điểm phát âm. Bạn có thể thử kết thúc lại phiên sau khi dịch vụ sẵn sàng.
              </div>
              {report.reason && (
                <div style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>{report.reason}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const overall = report.overall ?? {};
    const overallScore100 =
      typeof overall.score_0_100 === "number" ? overall.score_0_100 : null;
    const overallScore5 =
      typeof overall.score_0_5 === "number" ? overall.score_0_5 : null;
    const ringScore =
      overallScore100 !== null
        ? overallScore100
        : overallScore5 !== null
          ? overallScore5 * 20
          : null;

    const turns = Array.isArray(report.turns) ? report.turns : [];
    const weakWords = Array.isArray(report.weakWords) ? report.weakWords : [];
    const weakPhones = Array.isArray(report.weakPhones) ? report.weakPhones : [];

    return (
      <div className={styles.reportCard}>
        <div className={styles.reportHero}>
          {renderScoreRing(ringScore)}
          <div className={styles.reportHeroBody}>
            <div className={styles.reportHeroLabel}>Phân tích phát âm</div>
            <div className={styles.reportHeroTitle}>
              {overall.label ?? (ringScore !== null ? "Đã có kết quả" : "Đang chờ dữ liệu")}
            </div>
            <div className={styles.reportHeroChips}>
              {typeof report.processedTurnCount === "number" &&
                typeof report.turnCount === "number" ? (
                <span className={styles.reportChip}>
                  <span className={styles.reportChipDot} />
                  <strong>{report.processedTurnCount}</strong>/{report.turnCount} lượt được chấm
                </span>
              ) : null}
              {overall.sentenceBand && (
                <span className={styles.reportChip}>
                  Mức câu: <strong>{overall.sentenceBand}</strong>
                </span>
              )}
              {overallScore5 !== null && (
                <span className={styles.reportChip}>
                  GOP: <strong>{overallScore5.toFixed(2)}</strong>/5
                </span>
              )}
            </div>
          </div>
        </div>

        {turns.length > 0 && (
          <div className={styles.reportSection}>
            <h4 className={styles.reportSectionTitle}>Chi tiết theo từng lượt nói</h4>
            <div className={styles.turnList}>
              {turns.map((turn, index) => {
                const score100 =
                  typeof turn.score_0_100 === "number"
                    ? turn.score_0_100
                    : typeof turn.score_0_5 === "number"
                      ? turn.score_0_5 * 20
                      : null;
                const band = bandFromScore100(score100);
                const percent = score100 !== null ? Math.max(0, Math.min(100, Math.round(score100))) : 0;
                const text = turn.text ? `“${turn.text}”` : `Lượt ${index + 1}`;

                return (
                  <div key={turn.messageId ?? index} className={styles.turnCard}>
                    <div className={styles.turnIndex}>{index + 1}</div>
                    <div className={styles.turnBody}>
                      <div className={styles.turnText}>{text}</div>
                      <div className={styles.turnBar}>
                        <div
                          className={`${styles.turnBarFill} ${band ? styles[band] : ""}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {turn.rejectReason && (
                        <div className={styles.turnSkipped}>{turn.rejectReason}</div>
                      )}
                    </div>
                    {score100 !== null ? (
                      <div className={`${styles.turnScore} ${band ? styles[band] : ""}`}>
                        {Math.round(score100)}
                        <span className={styles.turnScoreUnit}>/100</span>
                      </div>
                    ) : (
                      <div className={styles.turnSkipped}>Bị bỏ qua</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {weakWords.length > 0 && (
          <div className={styles.reportSection}>
            <h4 className={styles.reportSectionTitle}>Từ cần luyện thêm</h4>
            <div className={styles.chipGrid}>
              {weakWords.map((item, index) => {
                const band = bandFromScore100(item.score_0_100);
                const score = typeof item.score_0_100 === "number" ? Math.round(item.score_0_100) : item.score_0_100;
                return (
                  <div key={`${item.word}-${index}`} className={styles.wordChip}>
                    <div className={styles.wordChipHead}>
                      <span className={styles.wordChipWord}>{item.word}</span>
                    </div>
                    {item.ipa && <div className={styles.wordChipIpa}>/{item.ipa}/</div>}
                    <div className={styles.wordChipFooter}>
                      <span className={`${styles.scoreBadge} ${band ? styles[band] : ""}`}>
                        {score}
                        <span className={styles.turnScoreUnit}>/100</span>
                      </span>
                      {typeof item.count === "number" && item.count > 1 && (
                        <span className={styles.countTag}>×{item.count}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {weakPhones.length > 0 && (
          <div className={styles.reportSection}>
            <h4 className={styles.reportSectionTitle}>Âm vị bị lặp lại lỗi nhiều nhất</h4>
            <div className={styles.chipGrid}>
              {weakPhones.map((item, index) => {
                const band = bandFromScore100(item.score_0_100);
                const score = typeof item.score_0_100 === "number" ? Math.round(item.score_0_100) : item.score_0_100;
                return (
                  <div key={`${item.phone}-${index}`} className={styles.phoneChip}>
                    <div className={styles.phoneChipPhone}>/{item.phone}/</div>
                    <div className={styles.wordChipFooter}>
                      <span className={`${styles.scoreBadge} ${band ? styles[band] : ""}`}>
                        {score}
                        <span className={styles.turnScoreUnit}>/100</span>
                      </span>
                      {typeof item.count === "number" && item.count > 1 && (
                        <span className={styles.countTag}>×{item.count}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const bandFromScore10 = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    if (value >= 8) return "bandGood";
    if (value >= 5.6) return "bandMedium";
    return "bandWeak";
  };

  const renderEvaluation = () => {
    if (!evaluation) return null;
    const { suggestions } = parseEvaluationDetails(evaluation);

    return (
      <div className={styles.reportCard}>
        <div className={styles.reportSection}>
          <h4 className={styles.reportSectionTitle}>Đánh giá tổng thể</h4>
          <div className={styles.evalGrid}>
            {defaultScores.map((metric) => {
              const raw = evaluation[metric.key] ?? 0;
              const value = typeof raw === "number" ? raw : Number(raw) || 0;
              const percent = Math.min(100, Math.round((value / 10) * 100));
              const band = bandFromScore10(value);
              return (
                <div key={metric.key} className={styles.evalTile}>
                  <div className={styles.evalTileLabel}>{metric.label}</div>
                  <div className={styles.evalTileValue}>
                    <span className={styles.evalTileScore}>
                      {value.toFixed ? value.toFixed(1) : value}
                    </span>
                    <span className={styles.evalTileMax}>/ 10</span>
                  </div>
                  <div className={styles.evalTileBar}>
                    <div
                      className={`${styles.evalTileFill} ${band ? styles[band] : ""}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {evaluation.summary && (
          <div className={styles.reportSection}>
            <h4 className={styles.reportSectionTitle}>Tóm tắt</h4>
            <div className={styles.summaryBox}>{evaluation.summary}</div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className={styles.reportSection}>
            <h4 className={styles.reportSectionTitle}>Gợi ý cải thiện</h4>
            <div className={styles.summaryBox}>
              <ul>
                {suggestions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <CreditBanner type="AI_CONVERSATION" credits={credits} />
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

      <ConversationHistorySidebar
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectSession={handleOpenHistorySession}
        onDelete={handleDeleteSession}
        activeId={viewingHistoryId}
      />

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
                className={`${styles.scenarioCard} ${selectedScenarioId === scenario.id ? styles.active : ""
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
          <div className={styles.difficultyField}>
            <div className={styles.difficultyHeader}>
              <label className={styles.difficultyLabel}>Độ khó AI</label>
              {isAiSuggested && (
                <span className={styles.systemBadge}>Hệ thống đề xuất</span>
              )}
            </div>

            <div className={styles.difficultyCard}>
              <div className={styles.difficultyCardBody}>
                <div className={styles.difficultyLevelTitle}>{selectedDifficultyMeta.label}</div>
                <div className={styles.difficultyLevelDesc}>{selectedDifficultyMeta.desc}</div>
              </div>

              <div className={styles.difficultyActions}>
                {isAiSuggested && suggestedRoadmapName && (
                  <div className={styles.tooltipWrapper} ref={tooltipRef}>
                    <button
                      type="button"
                      className={styles.infoBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTooltip((prev) => !prev);
                      }}
                      aria-label="Xem chi tiết đề xuất"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-info-icon lucide-info"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </button>

                    {showTooltip && (
                      <div className={styles.tooltipPopover}>
                        <div className={styles.tooltipContent}>
                          <p className={styles.tooltipText}>
                            Độ khó này được đề xuất theo trình độ hiện tại của bạn.
                          </p>
                          <div className={styles.tooltipDivider} />
                          <div className={styles.tooltipSourceBlock}>
                            <div className={styles.tooltipSourceTitle}>Nguồn đánh giá:</div>
                            <ul className={styles.tooltipSourceList}>
                              <li>{suggestedRoadmapName}</li>
                              <li>
                                Tiến độ hoàn thành: <strong>{suggestedRoadmapPercent}%</strong>
                              </li>
                            </ul>
                          </div>
                          {suggestedRoadmapId && (
                            <button
                              type="button"
                              className={styles.tooltipLinkBtn}
                              onClick={() => {
                                setShowTooltip(false);
                                navigate(`/roadmaps/${suggestedRoadmapId}/days`);
                              }}
                            >
                              Mở lộ trình
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className={`${styles.changeDifficultyBtn} ${showDifficultyPicker ? styles.changeActive : ""}`}
                  onClick={() => setShowDifficultyPicker((prev) => !prev)}
                  aria-expanded={showDifficultyPicker}
                  title={showDifficultyPicker ? "Thu gọn" : "Thay đổi độ khó"}
                  aria-label={showDifficultyPicker ? "Thu gọn" : "Thay đổi độ khó"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-settings2-icon lucide-settings-2"
                  >
                    <path d="M14 17H5" />
                    <path d="M19 7h-9" />
                    <circle cx="17" cy="17" r="3" />
                    <circle cx="7" cy="7" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {showDifficultyPicker && (
              <div className={styles.difficultyGrid}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    className={`${styles.difficultyChip} ${difficultyLevel === level.value ? styles.difficultyChipActive : ""
                      }`}
                    onClick={() => {
                      difficultyTouchedRef.current = true;
                      setDifficultyLevel(level.value);
                      setShowDifficultyPicker(false);
                    }}
                    title={level.desc}
                  >
                    <span className={styles.difficultyChipLabel}>{level.label}</span>
                    <span className={styles.difficultyChipDesc}>{level.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
            <div className={styles.chatHeaderActions}>
              <div className={styles.speedControlWrap} ref={speedMenuRef}>
                <button
                  type="button"
                  className={styles.speedToggleBtn}
                  onClick={() => setShowSpeedMenu((prev) => !prev)}
                  title="Tốc độ phát âm thanh"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{playbackSpeed}x</span>
                </button>
                {showSpeedMenu && (
                  <div className={styles.speedDropdown}>
                    {SPEED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.speedOption} ${playbackSpeed === opt.value ? styles.speedOptionActive : ""
                          }`}
                        onClick={() => {
                          setPlaybackSpeed(opt.value);
                          setShowSpeedMenu(false);
                          // Update current playing audio speed in real-time
                          if (audioElementRef.current) {
                            audioElementRef.current.playbackRate = opt.value;
                          }
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.historyLink}
                onClick={() => setShowHistory((prev) => !prev)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M12 7v5l4 2" />
                </svg>
                <span>Lịch sử</span>
              </button>
              {viewingHistoryId && (
                <button
                  type="button"
                  className={`${styles.historyLink} ${styles.historyLinkPrimary}`}
                  onClick={handleNewConversation}
                >
                  + Mới
                </button>
              )}
              <div className={styles.sessionStatus}>
                {conversation ? (conversation.status === "completed" ? "Đã kết thúc" : "Đang diễn ra") : "Chưa bắt đầu"}
              </div>
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !sendDisabled) {
                    event.preventDefault();
                    handleSendText();
                  }
                }}
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
            </div>
          )}

          {renderEvaluation()}
          {renderPronunciationReport()}

          <div className={styles.actions}>
            <button
              className={styles.endButton}
              onClick={handleCompleteSession}
              disabled={!conversation || conversation.status === "completed" || isFinalizing}
            >
              {isFinalizing ? "Đang tổng kết..." : "Kết thúc phiên"}
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
