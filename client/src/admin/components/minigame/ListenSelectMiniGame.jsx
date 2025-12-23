import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";

const ListenSelectMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const [audioUrl, setAudioUrl] = useState(minigame?.resources?.audioUrl ?? "");
  const [options, setOptions] = useState(
    Array.isArray(minigame?.resources?.options)
      ? [...minigame.resources.options]
      : []
  );
  const [correctIndex, setCorrectIndex] = useState(
    minigame?.resources?.correctIndex ?? 0
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAudioUrl(minigame?.resources?.audioUrl ?? "");
    setOptions(
      Array.isArray(minigame?.resources?.options)
        ? [...minigame.resources.options]
        : []
    );
    setCorrectIndex(minigame?.resources?.correctIndex ?? 0);
  }, [minigame]);

  const updateOption = (index, field, value) => {
    const copy = [...options];
    copy[index] = { ...copy[index], [field]: value };
    setOptions(copy);
  };

  const addOption = () => {
    setOptions([...options, { id: Date.now(), text: "", imageUrl: "" }]);
  };

  const removeOption = (index) => {
    const copy = [...options];
    copy.splice(index, 1);
    setOptions(copy);
  };

  const handleSave = async () => {
    if (!audioUrl.trim()) {
      toast.warning("Audio URL không được rỗng!");
      return;
    }

    if (options.length < 2) {
      toast.warning("Cần ít nhất 2 lựa chọn!");
      return;
    }

    const payload = {
      type: minigame?.type ?? "LISTEN_SELECT",
      prompt: minigame?.prompt ?? "",
      resources: {
        audioUrl: audioUrl.trim(),
        correctIndex,
        options: options.map((op) => ({
          id: op.id,
          text: op.text || "",
          imageUrl: op.imageUrl || "",
        })),
      },
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
          <h5>Minigame</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu minigame</div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        maxHeight: "74vh",
        overflow: "auto",
      }}
    >
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
        {/* AUDIO */}
        <div className="mb-3">
          <label className="form-label">Audio URL</label>
          <input
            className="form-control"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              className="mt-2"
              style={{ width: "100%" }}
            />
          )}
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Options</h6>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={addOption}
            >
              Thêm lựa chọn
            </button>
          </div>

          {options.length === 0 && (
            <div className="text-muted mb-2">Chưa có lựa chọn</div>
          )}

          {options.map((op, idx) => (
            <div key={op.id ?? idx} className="card mb-2">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                  <div className="col-md-5">
                    <label className="form-label">Text</label>
                    <input
                      className="form-control"
                      value={op.text}
                      onChange={(e) => updateOption(idx, "text", e.target.value)}
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label">Image URL</label>
                    <input
                      className="form-control"
                      value={op.imageUrl}
                      onChange={(e) =>
                        updateOption(idx, "imageUrl", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-md-2 d-flex justify-content-end">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeOption(idx)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {op.imageUrl && (
                  <div className="mt-2 text-center" style={{ padding: 6 }}>
                    <img
                      src={op.imageUrl}
                      alt={op.text}
                      style={{
                        maxHeight: 120,
                        objectFit: "contain",
                        width: "auto",
                      }}
                    />
                  </div>
                )}

                {/* Correct Index */}
                <div className="mt-3">
                  <label className="form-label">Là đáp án đúng?</label>
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctIndex === idx}
                    onChange={() => setCorrectIndex(idx)}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr />
        <div className="d-flex justify-content-end gap-2">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
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

export default ListenSelectMiniGame;
