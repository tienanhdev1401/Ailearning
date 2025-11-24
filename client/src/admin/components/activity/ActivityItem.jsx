import React, { useState } from "react";
import api from "../../../api/api";
import MiniGameList from "../minigame/MiniGameList";

const ActivityItem = ({ activity, onRefresh }) => {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Xóa activity này?")) return;
    try {
      await api.delete(`/activities/${activity.id}`);
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
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
          <button className="btn btn-sm btn-danger" onClick={handleDelete}>Xóa</button>
        </div>
      </div>

      {open && (
        <div className="card-footer">
          <MiniGameList activityId={activity.id} onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
};

export default ActivityItem;
