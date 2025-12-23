import React, { useEffect, useState } from "react";
import { useToast } from "../../../context/ToastContext";

const TypingChallengeMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [targetText, setTargetText] = useState(minigame?.resources?.targetText ?? "");
  const [caseSensitive, setCaseSensitive] = useState(Boolean(minigame?.resources?.caseSensitive));
  const [timeLimit, setTimeLimit] = useState(
    Number.isFinite(Number(minigame?.resources?.timeLimitSeconds)) ? Number(minigame?.resources?.timeLimitSeconds) : ""
  );
  const [hints, setHints] = useState(Array.isArray(minigame?.resources?.hints) ? [...minigame.resources.hints] : []);
  const [newHint, setNewHint] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setTargetText(minigame?.resources?.targetText ?? "");
    setCaseSensitive(Boolean(minigame?.resources?.caseSensitive));
    setTimeLimit(
      Number.isFinite(Number(minigame?.resources?.timeLimitSeconds)) && Number(minigame?.resources?.timeLimitSeconds) > 0
        ? Number(minigame?.resources?.timeLimitSeconds)
        : ""
    );
    setHints(Array.isArray(minigame?.resources?.hints) ? [...minigame.resources.hints] : []);
    setNewHint("");
  }, [minigame]);

  const addHint = () => {
    const trimmed = (newHint || "").trim();
    if (!trimmed) return;
    if (hints.length >= 5) {
      toast.warning("Tối đa 5 gợi ý");
      return;
    }
    setHints((prev) => [...prev, trimmed]);
    setNewHint("");
  };

  const updateHint = (index, value) => {
    setHints((prev) => prev.map((hint, idx) => (idx === index ? value : hint)));
  };

  const removeHint = (index) => {
    setHints((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }
    if (!targetText.trim()) {
      toast.warning("Target text không được rỗng");
      return;
    }

    const numericLimit = Number(timeLimit);
    if (timeLimit !== "" && (!Number.isFinite(numericLimit) || numericLimit <= 0)) {
      toast.warning("Thời gian phải là số dương");
      return;
    }

    const payload = {
      type: minigame?.type ?? "typing_challenge",
      prompt: prompt.trim(),
      resources: {
        targetText: targetText.trim(),
        caseSensitive,
        hints: hints.map((hint) => hint.trim()).filter(Boolean),
        ...(timeLimit === "" ? {} : { timeLimitSeconds: Math.floor(numericLimit) }),
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
    <div className="card" style={{ maxHeight: "74vh", overflowY: "auto" }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Minigame #{minigame.id}</strong> <span className="text-muted">({minigame.type})</span>
        </div>
        <div>
          {onDelete && (
            <button className="btn btn-sm btn-danger me-2" onClick={onDelete}>
              Xóa
            </button>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Prompt</label>
          <input className="form-control" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="form-label">Target text</label>
          <textarea className="form-control" rows={3} value={targetText} onChange={(e) => setTargetText(e.target.value)} />
        </div>

        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="typingCaseSensitive"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="typingCaseSensitive">
            Phân biệt chữ hoa chữ thường
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Thời gian (giây, tùy chọn)</label>
          <input
            className="form-control"
            type="number"
            min="0"
            placeholder="Ví dụ: 60"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0">Gợi ý (tối đa 5)</label>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                style={{ width: 260 }}
                placeholder="Thêm gợi ý"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHint();
                  }
                }}
              />
              <button className="btn btn-sm btn-outline-primary" onClick={addHint}>
                Thêm
              </button>
            </div>
          </div>

          {hints.length === 0 && <div className="text-muted">Chưa có gợi ý</div>}

          {hints.map((hint, index) => (
            <div key={index} className="input-group mb-2">
              <span className="input-group-text">{index + 1}</span>
              <input className="form-control" value={hint} onChange={(e) => updateHint(index, e.target.value)} />
              <button className="btn btn-outline-danger" onClick={() => removeHint(index)}>
                Xóa
              </button>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypingChallengeMiniGame;
