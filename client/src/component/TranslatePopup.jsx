import { useContext, useEffect, useState } from "react";
import { HighlightContext } from "../context/HighlightContext";

const TranslatePopup = () => {
  const { selectedText, setSelectedText, mousePos } = useContext(HighlightContext);
  const [translation, setTranslation] = useState("");
  const [synonyms, setSynonyms] = useState([]);

  useEffect(() => {
    if (!selectedText) return;

    const isSingleWord = selectedText.split(/\s+/).length === 1;

    // Dịch nghĩa (MyMemory API)
    const fetchTranslation = async () => {
      try {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selectedText)}&langpair=en|vi`
        );
        const data = await res.json();
        setTranslation(data.responseData.translatedText);
      } catch (err) {
        setTranslation("Không thể dịch");
      }
    };

    fetchTranslation();

    // Nếu là từ đơn, lấy synonyms (DictionaryAPI)
    if (isSingleWord) {
      const fetchSynonyms = async () => {
        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
          const data = await res.json();
          const syns = data[0]?.meanings?.[0]?.definitions?.[0]?.synonyms || [];
          setSynonyms(syns.slice(0, 3));
        } catch (err) {
          setSynonyms([]);
        }
      };
      fetchSynonyms();
    } else {
      setSynonyms([]);
    }

  }, [selectedText]);

  if (!selectedText) return null;

  return (
    <div style={{
      position: "absolute",
      top: mousePos.y + 10,
      left: mousePos.x + 10,
      zIndex: 9999,
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 10,
      boxShadow: "0 0 10px rgba(0,0,0,0.2)",
      maxWidth: 300
    }}>
      <div><strong>{selectedText}</strong> → {translation}</div>
      {synonyms.length > 0 && (
        <div>Đồng nghĩa: {synonyms.join(", ")}</div>
      )}
      <button onClick={() => setSelectedText("")} style={{ marginTop: 5 }}>Đóng</button>
    </div>
  );
};

export default TranslatePopup;
