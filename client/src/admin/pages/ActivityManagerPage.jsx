import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../src/api/api";
import ActivityList from "../components/activity/ActivityList";

const ActivityManagerPage = () => {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayContent, setDayContent] = useState(null);

  // new: add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSkill, setNewSkill] = useState("reading");
  const [newPointOfAc, setNewPointOfAc] = useState(0);
  const ALLOWED_SKILLS = ["reading", "listening", "speaking", "writing"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/days/${dayId}/activities`);
      const returned = resp.data;
      const items = returned?.data ?? returned;
      setDayContent(returned?.dayContent ?? null);
      setActivities(Array.isArray(items) ? items : items?.data ?? items ?? []);
    } catch (err) {
      console.error("Load activities error", err);
      setActivities([]);
      setDayContent(null);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  useEffect(() => {
    if (!dayId) return;
    load();
  }, [load]);

  const handleReorder = async (newActivities) => {
    setActivities(newActivities);
    const payload = {
      activities: newActivities.map((a, idx) => ({ id: a.id, order: idx + 1 })),
    };
    try {
      await api.patch("/activities/mutiple-update", payload);
    } catch (err) {
      console.error("Failed saving order", err);
      alert("Lưu thứ tự thất bại");
      await load();
    }
  };

  return (
    <div className="container p-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-secondary me-3" onClick={() => navigate(-1)}>Back</button>
        <h2 className="mb-0">Quản lý Activities - Day #{dayId}</h2>
      </div>

      {dayContent ? (
        <div className="mb-3">
          <h5>Nội dung day</h5>
          <div className="card p-3" dangerouslySetInnerHTML={{ __html: dayContent }} />
        </div>
      ) : null}

      <div className="mb-3">
        <div className="d-flex gap-2 mb-2">
          <button className="btn btn-primary" onClick={load} disabled={loading}>Tải lại</button>
          {!showAddForm && (
            <button className="btn btn-success" onClick={() => setShowAddForm(true)}>Thêm activity</button>
          )}
        </div>

        {showAddForm && (
          <div className="card card-body mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <input
                  className="form-control"
                  placeholder="Tiêu đề activity"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                >
                  {ALLOWED_SKILLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="pointOfAc"
                  value={newPointOfAc}
                  onChange={(e) => setNewPointOfAc(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    // validation
                    if (!newTitle || !newTitle.trim()) {
                      alert("Tiêu đề không được rỗng");
                      return;
                    }
                    if (!ALLOWED_SKILLS.includes(newSkill)) {
                      alert("Skill không hợp lệ");
                      return;
                    }
                    const point = Number(newPointOfAc);
                    if (!Number.isInteger(point)) {
                      alert("pointOfAc phải là số nguyên");
                      return;
                    }
                    try {
                      await api.post("/activities", {
                        title: newTitle.trim(),
                        dayId: Number(dayId),
                        order: activities.length + 1,
                        skill: newSkill,
                        pointOfAc: point,
                      });
                      // reset & reload
                      setNewTitle("");
                      setNewSkill("reading");
                      setNewPointOfAc(0);
                      setShowAddForm(false);
                      await load();
                    } catch (e) {
                      console.error(e);
                      alert("Tạo activity thất bại");
                    }
                  }}
                >
                  Lưu
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setShowAddForm(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ActivityList activities={activities} onReorder={handleReorder} onRefresh={load} />
    </div>
  );
};

export default ActivityManagerPage;
