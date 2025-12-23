import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../context/ToastContext";

const OPTION_KEYS = ["A", "B"];

const extractOptions = (resources) => {
  if (!resources || !Array.isArray(resources.options)) {
    return [
      { key: "A", label: "Đúng" },
      { key: "B", label: "Sai" },
    ];
  }

  return OPTION_KEYS.map((key, idx) => {
    const raw = resources.options[idx] ?? resources.options.find((opt) => (opt?.key || "").toUpperCase() === key);
    return {
      key,
      label: raw?.label ?? (idx === 0 ? "Đúng" : "Sai"),
    };
  });
};

const TrueFalseMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [statement, setStatement] = useState(minigame?.resources?.statement ?? "");
  const [options, setOptions] = useState(() => extractOptions(minigame?.resources));
  const [correctOption, setCorrectOption] = useState(() => (minigame?.resources?.correctOption || "A").toUpperCase());
  const [explanation, setExplanation] = useState(minigame?.resources?.explanation ?? "");
  const [saving, setSaving] = useState(false);

  const optionMap = useMemo(() => Object.fromEntries(options.map((opt) => [opt.key, opt.label])), [options]);

  useEffect(() => {
    const nextResources = minigame?.resources || {};
    setPrompt(minigame?.prompt ?? "");
    setStatement(nextResources.statement ?? "");
    setOptions(extractOptions(nextResources));
    setCorrectOption((nextResources.correctOption || "A").toUpperCase());
    setExplanation(nextResources.explanation ?? "");
  }, [minigame]);

  const updateOption = (key, label) => {
    setOptions((prev) => prev.map((opt) => (opt.key === key ? { ...opt, label } : opt)));
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }
    if (!statement.trim()) {
      toast.warning("Statement không được rỗng");
      return;
    }
    if (!OPTION_KEYS.every((key) => (optionMap[key] || "").trim())) {
      toast.warning("Vui lòng nhập đầy đủ nội dung cho cả hai lựa chọn");
      return;
    }

    const payload = {
      type: minigame?.type ?? "true_false",
      prompt: prompt.trim(),
      resources: {
        statement: statement.trim(),
        options: options.map((opt) => ({ key: opt.key, label: opt.label.trim() })),
        correctOption,
        explanation: explanation.trim() || undefined,
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
    return null;
  }

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
          <label className="form-label">Statement</label>
          <textarea className="form-control" rows={3} value={statement} onChange={(e) => setStatement(e.target.value)} />
        </div>

        <div className="mb-3">
          <h6>Lựa chọn</h6>
          {options.map((opt) => (
            <div key={opt.key} className="mb-2">
              <label className="form-label">Phương án {opt.key}</label>
              <input className="form-control" value={opt.label} onChange={(e) => updateOption(opt.key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="form-label">Đáp án đúng</label>
          <select className="form-select" value={correctOption} onChange={(e) => setCorrectOption(e.target.value)}>
            {OPTION_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label">Giải thích (tùy chọn)</label>
          <textarea className="form-control" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
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

export default TrueFalseMiniGame;
