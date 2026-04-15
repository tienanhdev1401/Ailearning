import { useContext, useEffect, useState } from "react";
import { HighlightContext } from "../context/HighlightContext";
import { ThemeContext } from "../context/ThemeContext";
import SaveToNotebookModal from "../client/components/Flashcard/SaveToNotebookModal";

const TranslatePopup = () => {
  const { selectedText, setSelectedText, mousePos, enablePopup } =
    useContext(HighlightContext);

  const [translation, setTranslation] = useState("");
  const [synonyms, setSynonyms] = useState([]);
  const [phonetic, setPhonetic] = useState("");
  const [hasTranslated, setHasTranslated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    if (!selectedText || !enablePopup) {
      setHasTranslated(false);
      setShowTooltip(false);
      return;
    }
    // Khi có text được chọn, hiển thị nút Tooltip thu gọn trước
    setShowTooltip(true);
    setHasTranslated(false);
    setTranslation("");
    setSynonyms([]);
    setPhonetic("");
  }, [selectedText, enablePopup]);

  const handleTranslateClick = async () => {
    setHasTranslated(true);
    setIsLoading(true);

    const isSingleWord = selectedText.trim().split(/\s+/).length === 1;

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

    const fetchEnglishData = async () => {
      try {
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

        const pho =
          entry?.phonetic ||
          entry?.phonetics?.find((p) => p.text)?.text ||
          "";
        setPhonetic(pho);

        const syns =
          entry?.meanings?.flatMap((m) => m.synonyms || []) || [];

        setSynonyms(syns.slice(0, 5));
      } catch {
        setSynonyms([]);
        setPhonetic("");
      }
    };

    await Promise.all([
      fetchTranslation(),
      isSingleWord ? fetchEnglishData() : Promise.resolve(),
    ]);

    setIsLoading(false);
  };

  if (!enablePopup || !selectedText || !showTooltip) return null;

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
  const saveButtonBg = isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.1)";
  const saveButtonColor = isDarkMode ? "#10b981" : "#059669";

  if (!hasTranslated) {
    return (
      <div
        id="translate-popup"
        style={{
          position: "absolute",
          top: mousePos.y + 15,
          left: mousePos.x + 15,
          zIndex: 9999,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: bg,
          borderRadius: 30,
          border: border,
          padding: "8px 16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          animation: "fadeSlideIn .25s ease-out",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          cursor: "pointer",
          color: textColor,
          fontWeight: 600,
          fontSize: 15,
          transition: "0.2s ease"
        }}
        onClick={handleTranslateClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        }}
      >
        <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7 1.62-4.33L19.12 17h-3.24Z" />
        </svg>
        Dịch
      </div>
    );
  }

  return (
    <>
      <div
        id="translate-popup"
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

        {isLoading ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: secondaryText, fontSize: 14 }}>
            Đang dịch...
          </div>
        ) : (
          <>
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

            {/* Nút lưu vào sổ tay */}
            <button
              onClick={() => setShowSaveModal(true)}
              style={{
                marginTop: 14,
                padding: "8px 18px",
                background: saveButtonBg,
                color: saveButtonColor,
                border: `1px solid ${saveButtonColor}44`,
                borderRadius: 14,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "0.12s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = saveButtonColor + "22";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = saveButtonBg;
              }}
            >
              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
              Lưu vào sổ tay
            </button>
          </>
        )}

        {/* Nút đóng */}
        <button
          onClick={() => {
            setSelectedText("");
            setHasTranslated(false);
            setShowTooltip(false);
          }}
          style={{
            marginTop: 8,
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

      <SaveToNotebookModal
        show={showSaveModal}
        onHide={() => setShowSaveModal(false)}
        term={selectedText}
        definition={translation}
      />
    </>
  );
};

export default TranslatePopup;

