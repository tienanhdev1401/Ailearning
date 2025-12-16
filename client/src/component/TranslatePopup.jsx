import { useContext, useEffect, useState } from "react";
import { HighlightContext } from "../context/HighlightContext";
import { ThemeContext } from "../context/ThemeContext";

const TranslatePopup = () => {
  const { selectedText, setSelectedText, mousePos, enablePopup } =
    useContext(HighlightContext);

  const [translation, setTranslation] = useState("");
  const [synonyms, setSynonyms] = useState([]);
  const [phonetic, setPhonetic] = useState("");
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (!selectedText || !enablePopup) return;

    const isSingleWord = selectedText.trim().split(/\s+/).length === 1;

    /* --- DỊCH --- */
    const fetchTranslation = async () => {
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            selectedText
          )}&langpair=en|vi`
        );
        const data = await res.json();
        setTranslation(data.responseData.translatedText);
      } catch {
        setTranslation("Không thể dịch");
      }
    };

    /* --- ĐỒNG NGHĨA + PHIÊN ÂM --- */
    const fetchEnglishData = async () => {
      try {
        // Chỉ cho từ tiếng Anh
        if (!/^[a-zA-Z]+$/.test(selectedText)) {
          setSynonyms([]);
          setPhonetic("");
          return;
        }

        const res = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText.toLowerCase()}`
        );
        const data = await res.json();

        const entry = data[0];

        // ⭐ PHIÊN ÂM
        const pho =
          entry?.phonetic ||
          entry?.phonetics?.find((p) => p.text)?.text ||
          "";
        setPhonetic(pho);

        // ⭐ SYNONYMS nằm trong meanings[] chứ không phải definitions[]
        const syns =
          entry?.meanings?.flatMap((m) => m.synonyms || []) || [];

        setSynonyms(syns.slice(0, 5));
      } catch {
        setSynonyms([]);
        setPhonetic("");
      }
    };

    fetchTranslation();
    if (isSingleWord) fetchEnglishData();
    else {
      setSynonyms([]);
      setPhonetic("");
    }
  }, [selectedText, enablePopup]);

  if (!enablePopup || !selectedText) return null;

  const bg = isDarkMode
    ? "rgba(18,18,18,0.78)"
    : "rgba(255,255,255,0.85)";
  const border = isDarkMode
    ? "1px solid rgba(255,255,255,0.06)"
    : "1px solid rgba(0,0,0,0.08)";
  const textColor = isDarkMode ? "#E6E7E8" : "#0B1220";
  const secondaryText = isDarkMode ? "rgba(230,231,232,0.78)" : "rgba(11,18,32,0.75)";
  const panelInnerBg = isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.55)";
  const panelInnerBorder = isDarkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.3)";
  const buttonBg = isDarkMode ? "#2563eb" : "rgba(0,0,0,0.75)";
  const buttonHover = isDarkMode ? "#1e4fd6" : "black";
  return (
    <div
      style={{
        position: "absolute",
        top: mousePos.y + 15,
        left: mousePos.x + 15,
        zIndex: 9999,

        // Glassmorphism UI
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: bg,
        borderRadius: 20,
        border: border,
        padding: "18px 20px",
        width: 260,

        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",

        animation: "fadeSlideIn .25s ease-out",
      }}
    >
      {/* Từ khóa */}
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: textColor }}>
        {selectedText}
      </div>

      {/* Phiên âm */}
      {phonetic && (
        <div
          style={{
            fontSize: 14,
            color: secondaryText,
            marginBottom: 8,
            fontStyle: "italic",
          }}
        >
          {phonetic}
        </div>
      )}

      {/* Nghĩa */}
      <div style={{ fontSize: 15, marginBottom: 12, color: textColor }}>
        → {translation}
      </div>

      {/* Đồng nghĩa */}
      {synonyms.length > 0 && (
        <div
          style={{
            marginTop: 6,
            padding: "10px 12px",
            background: panelInnerBg,
            borderRadius: 14,
            border: panelInnerBorder,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: textColor }}>Đồng nghĩa</div>

          <div style={{ fontSize: 14, color: secondaryText, lineHeight: 1.4 }}>
            {synonyms.join(", ")}
          </div>
        </div>
      )}

      {/* Nút đóng */}
      <button
        onClick={() => setSelectedText("")}
        style={{
          marginTop: 14,
          padding: "6px 18px",
          background: buttonBg,
          color: "white",
          border: "none",
          borderRadius: 14,
          cursor: "pointer",
          fontSize: 14,
          width: "100%",
          transition: "0.12s ease",
        }}
        onMouseEnter={(e) => (e.target.style.background = buttonHover)}
        onMouseLeave={(e) => (e.target.style.background = buttonBg)}
      >
        Đóng
      </button>

      {/* Animation */}
      <style>
        {`
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default TranslatePopup;
