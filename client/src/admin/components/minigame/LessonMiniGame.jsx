import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";

const LessonMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [content, setContent] = useState(minigame?.resources?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("preview"); // new: view mode toggle: "preview" | "edit"

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setContent(minigame?.resources?.content ?? "");
  }, [minigame]);

  const handleSave = async () => {
    if (!prompt || !prompt.trim()) {
      alert("Prompt không được rỗng");
      return;
    }
    const payload = {
      type: minigame?.type ?? "LESSON",
      prompt: prompt.trim(),
      resources: { content },
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
        <div className="d-flex justify-content-between align-items-center">
          <h5>Lesson Minigame</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu</div>
      </div>
    );
  }

  // sanitize content for preview; fallback to raw if DOMPurify not available
  const sanitized = typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(content || "") : (content || "");

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
            <h6 className="mb-0">Content (HTML)</h6>
            <div className="btn-group" role="group" aria-label="view-mode">
              <button
                type="button"
                className={`btn btn-sm ${mode === "preview" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setMode("preview")}
              >
                Xem
              </button>
              <button
                type="button"
                className={`btn btn-sm ${mode === "edit" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setMode("edit")}
              >
                Dán HTML
              </button>
            </div>
          </div>

          {mode === "edit" ? (
            <>
              <textarea
                className="form-control"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<div>...</div> (HTML)"
              />
              <div className="form-text mt-2">Dán hoặc sửa HTML tại đây. Khi lưu, nội dung thô sẽ được gửi lên server.</div>
            </>
          ) : (
            <div style={{ border: "1px solid #e9ecef", borderRadius: 6, padding: 12, background: "#fff" }}>
              {/* Render sanitized HTML */}
              <div dangerouslySetInnerHTML={{ __html: sanitized }} />
            </div>
          )}
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

export default LessonMiniGame;
