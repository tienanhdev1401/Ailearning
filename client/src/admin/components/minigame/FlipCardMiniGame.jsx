import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";

const FlipCardMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
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
    <div className="card" style={{ maxHeight: "74vh", overflow: "auto" }}>
      <div className="card-header d-flex justify-content-between align-items-center">
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
          <label className="form-label">Prompt</label>
          <textarea className="form-control" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Thẻ ghi nhớ (Cards)</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addCard}>Thêm thẻ</button>
          </div>

          {cards.length === 0 && <div className="text-muted mb-2">Chưa có thẻ nào</div>}

          {cards.map((card, idx) => (
            <div key={idx} className="card mb-2 bg-light">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-md-5">
                    <label className="form-label small mb-1">Thuật ngữ (Term)</label>
                    <input className="form-control" value={card.term} onChange={(e) => updateCard(idx, "term", e.target.value)} />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small mb-1">Định nghĩa (Definition)</label>
                    <input className="form-control" value={card.definition} onChange={(e) => updateCard(idx, "definition", e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex justify-content-end align-self-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeCard(idx)}>Xóa</button>
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
