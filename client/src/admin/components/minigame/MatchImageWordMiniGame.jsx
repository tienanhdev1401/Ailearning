import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";

const MatchImageWordMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  // Hooks must be called unconditionally
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [images, setImages] = useState((minigame?.resources?.images && Array.isArray(minigame.resources.images)) ? [...minigame.resources.images] : []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // sync when minigame changes
    setPrompt(minigame?.prompt ?? "");
    setImages((minigame?.resources?.images && Array.isArray(minigame.resources.images)) ? [...minigame.resources.images] : []);
  }, [minigame]);

  const updateImage = (index, field, value) => {
    const copy = [...images];
    copy[index] = { ...copy[index], [field]: value };
    setImages(copy);
  };

  const addImage = () => {
    setImages([...images, { id: Date.now(), imageUrl: "", correctWord: "" }]);
  };

  const removeImage = (index) => {
    const copy = [...images];
    copy.splice(index, 1);
    setImages(copy);
  };

  const handleSave = async () => {
    if (!prompt || !prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }
    const payload = {
      type: minigame?.type ?? "MATCH_IMAGE_WORD",
      prompt: prompt.trim(),
      resources: { images: images.map(img => ({ id: img.id, imageUrl: img.imageUrl || "", correctWord: img.correctWord || "" })) },
    };
    try {
      setSaving(true);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  // If no minigame loaded, show placeholder (hooks already called)
  if (!minigame) {
    return (
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5>Minigame</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Đóng</button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu minigame</div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        maxHeight: "74vh",   // ensure card fits inside modal and allows scrolling
        overflow: "auto",
      }}
    >
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
            <h6 className="mb-0">Images</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addImage}>Thêm ảnh</button>
          </div>

          {images.length === 0 && <div className="text-muted mb-2">Chưa có ảnh</div>}

          {images.map((img, idx) => (
            <div key={img.id ?? idx} className="card mb-2">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-md-6">
                    <label className="form-label">Image URL</label>
                    <input className="form-control" value={img.imageUrl} onChange={(e) => updateImage(idx, "imageUrl", e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Correct Word</label>
                    <input className="form-control" value={img.correctWord} onChange={(e) => updateImage(idx, "correctWord", e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeImage(idx)}>Xóa</button>
                  </div>
                </div>

                {img.imageUrl && (
                  <div className="mt-2 text-center" style={{ padding: 6 }}>
                    <img src={img.imageUrl} alt={img.correctWord || `img-${idx}`} style={{ maxHeight: 160, objectFit: "contain", width: "auto" }} />
                  </div>
                )}
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

export default MatchImageWordMiniGame;
