import React, { useState } from "react";
import ReactDOM from "react-dom";
import api from "../../../api/api";
import { FaEdit } from "react-icons/fa";
import MiniGameList from "../minigame/MiniGameList";
import { useToast } from "../../../context/ToastContext";

const ActivityItem = ({ activity, onRefresh }) => {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSkill, setEditSkill] = useState("");

  const ALLOWED_SKILLS = ["reading", "listening", "speaking", "writing"];

  const handleOpenEdit = () => {
    setEditTitle(activity.title || "");
    setEditSkill(activity.skill || "reading");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return toast.warning("Tiêu đề không được rỗng");
    if (!ALLOWED_SKILLS.includes(editSkill)) return toast.warning("Skill không hợp lệ");
    
    try {
      await api.put(`/activities/${activity.id}`, {
        title: editTitle.trim(),
        skill: editSkill
      });
      toast.success("Cập nhật thành công");
      setIsEditing(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật thất bại");
    }
  };

  const handleDelete = async () => {
    const confirmed = await toast.confirm("Xóa activity này?", { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
    if (!confirmed) return;
    try {
      await api.delete(`/activities/${activity.id}`);
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="card">
      <div className="card-body d-flex align-items-center justify-content-between">
        <div>
          <h5 className="card-title mb-1">#{activity.order} - {activity.title || activity.skill || "Activity"}</h5>
          <p className="mb-0 text-muted small">{activity.content ? (typeof activity.content === "string" ? activity.content : "") : ""}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(s => !s)}>
            {open ? "Ẩn minigames" : "Xem minigames"}
          </button>
          <button className="btn btn-sm border-0 bg-transparent text-primary p-1 mx-1" onClick={handleOpenEdit} title="Sửa">
            <FaEdit />
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>Xóa</button>
        </div>
      </div>

      {open && (
        <div className="card-footer">
          <MiniGameList activityId={activity.id} onRefresh={onRefresh} />
        </div>
      )}

      {isEditing && ReactDOM.createPortal(
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
        >
          <div className="card shadow p-4" style={{ width: 600 }}>
            <h5 className="mb-3">Cập nhật Activity</h5>
            
            <div className="mb-3">
              <label className="form-label fw-semibold">Tiêu đề</label>
              <input
                className="form-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-semibold">Skill</label>
              <select
                className="form-select"
                value={editSkill}
                onChange={(e) => setEditSkill(e.target.value)}
              >
                {ALLOWED_SKILLS.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
            
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Đóng</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Lưu</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActivityItem;
