import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Editor } from "@tinymce/tinymce-react";
import { useToast } from "../../../context/ToastContext";

const LessonMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [content, setContent] = useState(minigame?.resources?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("preview"); // preview | edit

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setContent(minigame?.resources?.content ?? "");
  }, [minigame]);

  const handleSave = async () => {
    if (!prompt || !prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }

    const payload = {
      type: minigame?.type ?? "LESSON",
      prompt: prompt.trim(),
      resources: { content }, // TinyMCE returns pure HTML
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
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu</div>
      </div>
    );
  }

  const sanitized = DOMPurify.sanitize(content || "");

  return (
    <div className="card" style={{ maxHeight: "74vh", overflow: "auto" }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Minigame #{minigame.id}</strong>{" "}
          <span className="text-muted">({minigame.type})</span>
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
        {/* PROMPT */}
        <div className="mb-3">
          <label className="form-label">Prompt</label>
          <input
            className="form-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* EDITOR */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Content (Word → HTML)</h6>

            <div className="btn-group">
              <button
                type="button"
                className={`btn btn-sm ${
                  mode === "preview" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setMode("preview")}
              >
                Xem
              </button>

              <button
                type="button"
                className={`btn btn-sm ${
                  mode === "edit" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => setMode("edit")}
              >
                Soạn thảo (Word)
              </button>
            </div>
          </div>

          {/* TinyMCE Mode */}
          {mode === "edit" ? (
            <Editor
              apiKey="5h1mny4wdy7lwto04bpgonbbj9ymfa8bmjxmmjiee045hxq7"
              value={content}
              init={{
                height: 350,
                menubar: false,
                plugins: "lists table paste link image code",
                toolbar:
                  "undo redo | bold italic underline | bullist numlist | table | link image | alignleft aligncenter alignright | code",

                // Auto clean Word formatting
                paste_data_images: false,
                paste_as_text: false,
                paste_webkit_styles: "bold italic underline",
                paste_merge_formats: true,
                paste_convert_word_fake_lists: true,
                paste_retain_style_properties: "color font-size",

                content_style:
                  "body { font-family: Arial, sans-serif; font-size: 14px; background: transparent; }",
              }}
              onEditorChange={(val) => setContent(val)}
            />
          ) : (
            <div
              style={{
                border: "1px solid #e9ecef",
                borderRadius: 6,
                padding: 12,
                background: "#fff",
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: sanitized }} />
            </div>
          )}
        </div>

        <hr />

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

export default LessonMiniGame;
