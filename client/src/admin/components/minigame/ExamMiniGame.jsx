import React, { useState, useEffect } from "react";
import { useToast } from "../../../context/ToastContext";

const ExamMiniGame = ({ minigame, onClose, onSave, onDelete }) => {
  const toast = useToast();
  const [prompt, setPrompt] = useState(minigame?.prompt ?? "");
  const [questions, setQuestions] = useState(
    Array.isArray(minigame?.resources?.questions)
      ? [...minigame.resources.questions]
      : []
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrompt(minigame?.prompt ?? "");
    setQuestions(
      Array.isArray(minigame?.resources?.questions)
        ? [...minigame.resources.questions]
        : []
    );
  }, [minigame]);

  const updateQuestion = (index, field, value) => {
    const copy = [...questions];
    copy[index] = { ...copy[index], [field]: value };
    setQuestions(copy);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const copy = [...questions];
    copy[qIndex].options[optIndex] = value;
    setQuestions(copy);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
      },
    ]);
  };

  const removeQuestion = (index) => {
    const copy = [...questions];
    copy.splice(index, 1);
    setQuestions(copy);
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.warning("Prompt không được rỗng");
      return;
    }

    for (const q of questions) {
      if (!q.question.trim()) return toast.warning("Câu hỏi không được rỗng");
      if (!q.options.every((o) => o.trim())) return toast.warning("Mỗi đáp án đều phải có nội dung");
    }

    const payload = {
      type: minigame?.type ?? "exam",
      prompt: prompt.trim(),
      resources: {
        questions: questions.map((q) => ({
          question: q.question,
          options: [...q.options],
          correctIndex: Number(q.correctIndex),
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
          <h5>Exam Minigame</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="text-muted mt-2">Không có dữ liệu minigame</div>
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
        {/* Prompt */}
        <div className="mb-3">
          <label className="form-label">Prompt</label>
          <textarea
            className="form-control"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Questions */}
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Questions</h6>
            <button className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
              Thêm câu hỏi
            </button>
          </div>

          {questions.length === 0 && <div className="text-muted">Chưa có câu hỏi</div>}

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <strong>Câu {qIndex + 1}</strong>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeQuestion(qIndex)}
                  >
                    Xóa
                  </button>
                </div>

                {/* Question text */}
                <div className="mt-2">
                  <label className="form-label">Nội dung câu hỏi</label>
                  <input
                    className="form-control"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  />
                </div>

                {/* Options */}
                <div className="mt-3">
                  <label className="form-label">Đáp án</label>
                  {q.options.map((opt, optIndex) => (
                    <div className="input-group mb-2" key={optIndex}>
                      <span className="input-group-text">{optIndex + 1}</span>
                      <input
                        className="form-control"
                        value={opt}
                        onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Correct index */}
                <div className="mt-3">
                  <label className="form-label">Đáp án đúng (0-3)</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    className="form-control"
                    value={q.correctIndex}
                    onChange={(e) => updateQuestion(qIndex, "correctIndex", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
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

export default ExamMiniGame;
