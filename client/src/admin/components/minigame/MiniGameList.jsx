import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/api";
import MatchImageWordMiniGame from "./MatchImageWordMiniGame";

const MiniGameList = ({ activityId, onRefresh }) => {
  const [minigames, setMinigames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await api.get(`/activities/${activityId}/minigames`);
      setMinigames(resp.data ?? []);
    } catch (err) {
      console.error(err);
      setMinigames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activityId) return;
    load();
  }, [activityId]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const resp = await api.get(`/minigames/${id}`);
      setSelected(resp.data);
    } catch (err) {
      console.error("Load minigame detail failed", err);
      alert("Không thể tải chi tiết minigame");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelected(null);

  // save từ modal -> gọi API PUT, reload list và cập nhật selected
  const handleSaveDetail = async (id, payload) => {
    try {
      const resp = await api.put(`/minigames/${id}`, payload);
      // cập nhật selected với dữ liệu trả về (nếu server trả)
      setSelected(resp.data ?? { ...selected, ...payload });
      await load();
      onRefresh && onRefresh();
      alert("Lưu minigame thành công");
    } catch (err) {
      console.error("Save minigame failed", err);
      alert("Lưu minigame thất bại");
    }
  };

  // xóa từ modal
  const handleDeleteDetail = async (id) => {
    if (!window.confirm("Xác nhận xóa minigame?")) return;
    try {
      await api.delete(`/minigames/${id}`);
      closeDetail();
      await load();
      onRefresh && onRefresh();
      alert("Xóa thành công");
    } catch (err) {
      console.error("Delete minigame failed", err);
      alert("Xóa thất bại");
    }
  };

  const handleAdd = async () => {
    const type = window.prompt("Type (e.g. MATCH_IMAGE_WORD):", "MATCH_IMAGE_WORD");
    if (!type) return;
    const promptText = window.prompt("Prompt text:", "Example prompt");
    const resourcesRaw = window.prompt("Resources as JSON (array):", '[]');
    let resources = [];
    try { resources = JSON.parse(resourcesRaw); } catch (e) { alert("Resources JSON không hợp lệ"); return; }

    try {
      await api.post("/minigames", {
        type,
        prompt: promptText,
        resources,
        activityId,
      });
      await load();
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      alert("Tạo minigame thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa minigame?")) return;
    try {
      await api.delete(`/minigames/${id}`);
      await load();
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    }
  };

  // prevent body scroll when modal open
  useEffect(() => {
    if (selected) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return;
  }, [selected]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Minigames ({minigames.length})</h6>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-primary" onClick={handleAdd}>Thêm minigame</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>Tải lại</button>
        </div>
      </div>

      <ul className="list-group">
        {minigames.map((m) => (
          <li key={m.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div style={{ cursor: "pointer" }} onClick={() => openDetail(m.id)}>
              <strong>Thể loại:</strong> {m.constructorName ?? m.type ?? "Minigame"}
              <div className="small text-muted">{m.prompt}</div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>Xóa</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Render modal into document.body via portal to avoid stacking-context issues */}
      {selected && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeDetail}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2147483647, // very high to ensure on top
            padding: 16,
            pointerEvents: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: 900,
              maxHeight: "80vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              padding: 12,
            }}
          >
            {detailLoading ? (
              <div className="card p-3">Loading...</div>
            ) : (
              (selected.type === "MATCH_IMAGE_WORD" || selected.type === "match_image_word") ? (
                <MatchImageWordMiniGame
                  minigame={selected}
                  onClose={closeDetail}
                  onSave={(payload) => handleSaveDetail(selected.id, payload)}
                  onDelete={() => handleDeleteDetail(selected.id)}
                />
              ) : (
                <div className="card p-3">
                  <div className="d-flex justify-content-between">
                    <h5>Minigame: {selected.type}</h5>
                    <div>
                      <button className="btn btn-sm btn-danger me-2" onClick={() => handleDeleteDetail(selected.id)}>Xóa</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={closeDetail}>Đóng</button>
                    </div>
                  </div>
                  <pre style={{ maxHeight: 400, overflow: "auto" }}>{JSON.stringify(selected, null, 2)}</pre>
                </div>
              )
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MiniGameList;
