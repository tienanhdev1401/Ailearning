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

  const addCard = () => {
    setCards([...cards, { term: "", definition: "" }]);
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
      resources: { cards: cards.map(c => ({ term: c.term.trim(), definition: c.definition.trim() })) },
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
                  <div className="col-md-5">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Thuật ngữ (Term)</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.term} onChange={(e) => updateCard(idx, "term", e.target.value)} />
                  </div>
                  <div className="col-md-5">
                    <label className={`form-label small mb-1 fw-semibold ${isDarkMode ? 'text-white' : 'text-muted'}`}>Định nghĩa (Definition)</label>
                    <input className={`form-control ${isDarkMode ? 'bg-dark text-white border-secondary' : ''}`} value={card.definition} onChange={(e) => updateCard(idx, "definition", e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex justify-content-end">
                    <button className="btn btn-sm btn-danger px-3" onClick={() => removeCard(idx)}>Xóa</button>
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
