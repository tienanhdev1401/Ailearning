import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../src/api/api";
import ActivityList from "../components/activity/ActivityList";
import { useToast } from '../../context/ToastContext';

const ActivityManagerPage = () => {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showWordImportForm, setShowWordImportForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSkill, setNewSkill] = useState("reading");
  const [newPointOfAc, setNewPointOfAc] = useState(0);
  const [wordFile, setWordFile] = useState(null);
  const [wordActivityTitle, setWordActivityTitle] = useState("");
  const [selectedWordMinigames, setSelectedWordMinigames] = useState([]);
  const [importingWord, setImportingWord] = useState(false);
  const ALLOWED_SKILLS = ["reading", "listening", "speaking", "writing"];
  const WORD_MINIGAME_OPTIONS = [
    { value: "true_false", label: "True / False" },
    { value: "sentence_builder", label: "Sentence Builder" },
    { value: "typing_challenge", label: "Typing Challenge" },
    { value: "flip_card", label: "Flip Card" },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/days/${dayId}/activities`);
      const returned = resp.data;
      const items = returned?.data ?? returned;
      setActivities(Array.isArray(items) ? items : items?.data ?? items ?? []);
    } catch (err) {
      console.error("Load activities error", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  useEffect(() => {
    if (!dayId) return;
    load();
  }, [load, dayId]);

  const handleReorder = async (newActivities) => {
    setActivities(newActivities);
    const payload = {
      activities: newActivities.map((a, idx) => ({ id: a.id, order: idx + 1 })),
    };
    try {
      await api.patch("/activities/mutiple-update", payload);
    } catch (err) {
      console.error("Failed saving order", err);
      toast.error("Lưu thứ tự thất bại");
      await load();
    }
  };

  return (
    <div className="container p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            className="btn btn-secondary me-3"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <h2 className="mb-0">Quản lý Activities - Day #{dayId}</h2>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={load} disabled={loading}>Refesh</button>
          <button className="btn btn-outline-success" onClick={() => setShowWordImportForm(true)}>
            Import Word
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Thêm activity</button>
        </div>
      </div>
      {showWordImportForm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
        >
          <div className="card shadow p-4" style={{ width: 680 }}>
            <h5 className="mb-3">Import file Word tạo activity + lesson</h5>

            <div className="mb-3">
              <label className="form-label fw-semibold">File Word (.docx)</label>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="form-control"
                onChange={(e) => setWordFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Tên activity (tuỳ chọn)</label>
              <input
                className="form-control"
                placeholder="Để trống để Gemini tự đặt tiêu đề"
                value={wordActivityTitle}
                onChange={(e) => setWordActivityTitle(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Minigame tuỳ chọn</label>
              <div className="row">
                {WORD_MINIGAME_OPTIONS.map((option) => (
                  <div className="col-6" key={option.value}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`word-game-${option.value}`}
                        checked={selectedWordMinigames.includes(option.value)}
                        onChange={(e) => {
                          setSelectedWordMinigames((prev) => {
                            if (e.target.checked) return [...prev, option.value];
                            return prev.filter((item) => item !== option.value);
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor={`word-game-${option.value}`}>
                        {option.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <small className="text-muted">
                Luôn tạo bắt buộc minigame Lesson từ nội dung file Word.
              </small>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-secondary"
                disabled={importingWord}
                onClick={() => {
                  setShowWordImportForm(false);
                  setWordFile(null);
                  setWordActivityTitle("");
                  setSelectedWordMinigames([]);
                }}
              >
                Đóng
              </button>

              <button
                className="btn btn-success"
                disabled={importingWord}
                onClick={async () => {
                  if (!wordFile) return toast.warning("Vui lòng chọn file Word");

                  try {
                    setImportingWord(true);
                    const formData = new FormData();
                    formData.append("word_file", wordFile);
                    if (wordActivityTitle.trim()) formData.append("activityTitle", wordActivityTitle.trim());
                    formData.append("minigameTypes", JSON.stringify(selectedWordMinigames));

                    const response = await api.post(`/days/${dayId}/import-word`, formData, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });

                    toast.success(response?.data?.message || "Import Word thành công");
                    setShowWordImportForm(false);
                    setWordFile(null);
                    setWordActivityTitle("");
                    setSelectedWordMinigames([]);
                    await load();
                  } catch (err) {
                    console.error(err);
                    toast.error(err?.response?.data?.message || "Import Word thất bại");
                  } finally {
                    setImportingWord(false);
                  }
                }}
              >
                {importingWord ? "Đang tạo..." : "Tạo activity từ Word"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* POPUP FORM ADD ACTIVITY */}
        {showAddForm && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
        >
          <div className="card shadow p-4" style={{ width: 600 }}>
            <h5 className="mb-3">Thêm Activity</h5>

            {/* TIÊU ĐỀ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Tiêu đề</label>
              <input
                className="form-control"
                placeholder="Nhập tiêu đề"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            {/* SKILL COMBOBOX – KHÔNG ĐƯỢC NHẬP */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Skill</label>

              <select
                className="form-select"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              >
                <option value="">-- Chọn skill --</option>
                {ALLOWED_SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>

            {/* ĐIỂM */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Điểm activity</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ví dụ: 10"
                value={newPointOfAc}
                onChange={(e) => setNewPointOfAc(e.target.value)}
              />
            </div>

            {/* BUTTONS */}
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Đóng
              </button>

              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!newTitle.trim()) return toast.warning("Tiêu đề không được rỗng");
                  if (!ALLOWED_SKILLS.includes(newSkill))
                    return toast.warning("Skill không hợp lệ");
                  if (!Number.isInteger(Number(newPointOfAc)))
                    return toast.warning("Điểm phải là số nguyên");

                  try {
                    await api.post("/activities", {
                      title: newTitle.trim(),
                      dayId: Number(dayId),
                      order: activities.length + 1,
                      skill: newSkill,
                      pointOfAc: Number(newPointOfAc),
                    });

                    setNewTitle("");
                    setNewSkill("reading");
                    setNewPointOfAc(0);
                    setShowAddForm(false);
                    await load();
                  } catch (err) {
                    console.error(err);
                    toast.error("Tạo activity thất bại");
                  }
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      <ActivityList activities={activities} onReorder={handleReorder} onRefresh={load} />
    </div>
  );
};

export default ActivityManagerPage;
