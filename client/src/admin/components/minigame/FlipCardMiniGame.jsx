import React, { useState, useEffect, useContext } from "react";
import { useToast } from "../../../context/ToastContext";
import { ThemeContext } from "../../../context/ThemeContext";

const FlipCardMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [cards, setCards] = useState((minigame?.resources?.cards && Array.isArray(minigame.resources.cards)) ? [...minigame.resources.cards] : []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setCards((minigame?.resources?.cards && Array.isArray(minigame.resources.cards)) ? [...minigame.resources.cards] : []);
  }, [minigame]);

  const updateCard = (index, field, value) => {
    const copy = [...cards];
    copy[index] = { ...copy[index], [field]: value };
    setCards(copy);
  };

  const fetchDictionaryInfo = async (index, word) => {
    if (!word || word.trim().length < 2) return;

    try {
      // 1. Fetch Dictionary Info (Phonetic & Part of Speech)
      const dictPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`);

      // 2. Fetch Translation (Google Translate API)
      const transPromise = fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word.trim())}`);

      const [dictRes, transRes] = await Promise.all([dictPromise, transPromise]);

      let phonetic = "";
      let partOfSpeech = "";
      let translation = "";

      if (dictRes.ok) {
        const dictData = await dictRes.json();
        if (Array.isArray(dictData) && dictData.length > 0) {
          const entry = dictData[0];
          phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(p => p.text)?.text) || "";
          partOfSpeech = entry.meanings?.[0]?.partOfSpeech || "";
        }
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        if (Array.isArray(transData) && transData[0] && transData[0][0]) {
          translation = transData[0][0][0];
        }
      }

      const copy = [...cards];
      // Always update if we found results, because if the term changed, the old info is likely wrong
      if (phonetic) copy[index].phonetic = phonetic;
      if (partOfSpeech) copy[index].partOfSpeech = partOfSpeech;
      if (translation) copy[index].definition = translation;
      setCards(copy);

    } catch (err) {
      console.error("Auto-fetch error:", err);
    }
  };

  const addCard = () => {
    setCards([...cards, { term: "", definition: "", phonetic: "", partOfSpeech: "" }]);
  };

  const removeCard = (index) => {
    const copy = [...cards];
    copy.splice(index, 1);
    setCards(copy);
  };

  const handleSave = async () => {
    if (!prompt || !prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }
    if (cards.length === 0) {
      toast.warning("Cần ít nhất 1 thẻ");
      return;
    }
    if (cards.some(c => !c.term.trim() || !c.definition.trim())) {
      toast.warning("Vui lòng điền đủ Thuật ngữ và Định nghĩa");
      return;
    }

    const payload = {
      type: "flip_card",
      prompt: prompt.trim(),
      resources: {
        cards: cards.map(c => ({
          term: c.term.trim(),
          definition: c.definition.trim(),
          phonetic: c.phonetic?.trim() || "",
          partOfSpeech: c.partOfSpeech?.trim() || ""
        }))
      },
    };
    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!minigame) return null;

  return (
    <div className={`card ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`} style={{ maxHeight: "74vh", overflow: "auto" }}>
      <div className={`card-header d-flex justify-content-between align-items-center ${isDarkMode ? 'bg-dark border-secondary' : ''}`}>
        <div>
          <strong>Minigame #{minigame.id}</strong> <span className="text-muted">({minigame.type})</span>
        </div>
        <div>
          {onDelete && <button className="btn btn-sm btn-danger me-2" onClick={onDelete}>Xóa</button>}
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>

      <div className="card-body">
        <div className="mb-3">
          <label className={`form-label fw-bold ${isDarkMode ? 'text-white' : ''}`}>Prompt</label>
          <textarea className={`form-control ${isDarkMode ? 'bg-secondary text-white border-dark' : ''}`} rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className={`mb-0 fw-bold ${isDarkMode ? 'text-white' : ''}`}>Thẻ ghi nhớ (Cards)</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addCard}>Thêm thẻ</button>
          </div>

          {cards.length === 0 && <div className="text-muted mb-2">Chưa có thẻ nào</div>}

          {cards.map((card, idx) => (
            <div key={idx} className={`card mb-2 ${isDarkMode ? 'bg-secondary border-dark text-white' : 'bg-light'}`}>
              <div className="card-body p-3">
                <div className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Thuật ngữ (Term)</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.term} onChange={(e) => updateCard(idx, "term", e.target.value)} onBlur={(e) => fetchDictionaryInfo(idx, e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Định nghĩa (Definition)</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.definition} onChange={(e) => updateCard(idx, "definition", e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Phiên âm</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.phonetic || ""} placeholder="/.../" onChange={(e) => updateCard(idx, "phonetic", e.target.value)} />
                  </div>
                  <div className="col-md-1">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Loại</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.partOfSpeech || ""} placeholder="n,v,adj" onChange={(e) => updateCard(idx, "partOfSpeech", e.target.value)} />
                  </div>
                  <div className="col-md-1 d-flex justify-content-end">
                    <button className="btn btn-sm btn-danger px-2" onClick={() => removeCard(idx)}>Xóa</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr />
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default FlipCardMiniGame;
