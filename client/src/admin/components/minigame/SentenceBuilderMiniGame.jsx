import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";

const SentenceBuilderMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  // hooks always called
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [tokens, setTokens] = useState(Array.isArray(minigame?.resources?.tokens) ? [...minigame.resources.tokens] : []);
  const [newTokenText, setNewTokenText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setTokens(Array.isArray(minigame?.resources?.tokens) ? [...minigame.resources.tokens] : []);
    setNewTokenText("");
  }, [minigame]);

  const updateToken = (index, text) => {
    const copy = [...tokens];
    copy[index] = { ...copy[index], text };
    setTokens(copy);
  };

  const addToken = () => {
    const txt = (newTokenText || "").trim();
    if (!txt) return;
    setTokens([...tokens, { id: Date.now(), text: txt }]);
    setNewTokenText("");
  };

  const removeToken = (index) => {
    const copy = [...tokens];
    copy.splice(index, 1);
    setTokens(copy);
  };

  const moveToken = (index, dir) => {
    const copy = [...tokens];
    const to = index + dir;
    if (to < 0 || to >= copy.length) return;
    const tmp = copy[to];
    copy[to] = copy[index];
    copy[index] = tmp;
    setTokens(copy);
  };

  const handleSave = async () => {
    if (!prompt || !prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }
    const payload = {
      type: minigame?.type ?? "SENTENCE_BUILDER",
      prompt: prompt.trim(),
      resources: { tokens: tokens.map(t => ({ id: t.id, text: t.text })) },
    };
    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  if (!minigame) {
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between">
          <h5>Sentence Builder</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu</div>
      </div>
    );
  }

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
          <input className="form-control" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Tokens</h6>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                style={{ width: 220 }}
                placeholder="New token text"
                value={newTokenText}
                onChange={(e) => setNewTokenText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addToken(); }}
              />
              <button className="btn btn-sm btn-outline-primary" onClick={addToken}>Thêm</button>
            </div>
          </div>

          {tokens.length === 0 && <div className="text-muted mb-2">Chưa có token</div>}

          {tokens.map((t, idx) => (
            <div key={t.id ?? idx} className="d-flex align-items-center mb-2">
              <div className="input-group">
                <span className="input-group-text">{idx + 1}</span>
                <input
                  className="form-control"
                  value={t.text}
                  onChange={(e) => updateToken(idx, e.target.value)}
                />
                <button className="btn btn-outline-secondary" onClick={() => moveToken(idx, -1)} title="Move up">↑</button>
                <button className="btn btn-outline-secondary" onClick={() => moveToken(idx, 1)} title="Move down">↓</button>
                <button className="btn btn-outline-danger" onClick={() => removeToken(idx)}>Xóa</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <h6>Preview</h6>
          <div style={{ padding: 12, border: "1px solid #e9ecef", borderRadius: 6, background: "#fff" }}>
            {tokens.length ? tokens.map(t => t.text).join(" ") : <span className="text-muted">No tokens</span>}
          </div>
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

export default SentenceBuilderMiniGame;
