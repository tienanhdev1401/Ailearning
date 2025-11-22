import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

const emptyForm = { dayNumber: '', theme: '', description: '', condition: '' };

const ROWS_PER_ROW = 7;      // số cột
const DAY_HEIGHT = 170;      // chiều cao ô day (giữ nguyên như bạn muốn)
const GAP = 16;              // gap giữa ô (giống style trước)

const RoadmapDaysPage = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();

  const [roadmap, setRoadmap] = useState(null);
  const [days, setDays] = useState([]);
  const [modal, setModal] = useState({ type: null, payload: null });
  const [form, setForm] = useState(emptyForm);
  const [hoveredDay, setHoveredDay] = useState(null);

  const loadRoadmap = useCallback(async () => {
    try {
      const res = await api.get(`/roadmaps/${roadmapId}`);
      setRoadmap(res.data);

      const sorted = (res.data.days || []).sort(
        (a, b) => Number(a.dayNumber) - Number(b.dayNumber)
      );

      setDays(sorted);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || String(err));
    } 
  }, [roadmapId]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ type: 'add', payload: null });
  };

  const openAddAt = (dayNumber) => {
    setForm({ ...emptyForm, dayNumber });
    setModal({ type: 'add', payload: null });
  };

  const openEdit = (day) => {
    setForm({
      dayNumber: day.dayNumber,
      description: day.description || '',
      condition: day.condition ?? ''
    });
    setModal({ type: 'edit', payload: day });
  };

  const closeModal = () => {
    setModal({ type: null, payload: null });
    setForm(emptyForm);
  };

  const createDay = async () => {
    try {
      const body = {
        roadmapId: Number(roadmapId),
        dayNumber: Number(form.dayNumber),
        description: form.description,
        condition: form.condition ? Number(form.condition) : undefined
      };

      await api.post(`/roadmaps/${roadmapId}/days`, body);
      closeModal();
      loadRoadmap();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || String(err));
    }
  };

  const updateDay = async () => {
    try {
      const body = {
        dayNumber: Number(form.dayNumber),
        description: form.description,
        condition: form.condition ? Number(form.condition) : undefined
      };

      await api.put(`/days/${modal.payload.id}`, body);
      closeModal();
      loadRoadmap();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || String(err));
    }
  };

  const saveDay = async () => {
    if (modal.type === "add") return createDay();
    if (modal.type === "edit") return updateDay();
  };

  const deleteDay = async (day) => {
    if (!window.confirm(`Xác nhận xoá ngày ${day.dayNumber}?`)) return;

    try {
      await api.delete(`/days/${day.id}`);
      loadRoadmap();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || String(err));
    }
  };

  // --- Tính chiều cao container dynamic ---
  const rowCount = days.length === 0 ? 0 : Math.ceil(days.length / ROWS_PER_ROW);
  // Nếu rowCount === 0, để undefined để grid fit nội dung (không chiếm chỗ)
  const gridHeight =
    rowCount > 0
      ? rowCount * DAY_HEIGHT + (rowCount - 1) * GAP // rows * rowHeight + gaps giữa hàng
      : undefined;

  return (
    <div className="calendar-page container-fluid p-5 p-lg-4" style={{ marginTop: "24px" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div className="d-flex align-items-center mb-3">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/roadmaps')}
            >
              ← Back
            </button>

            <h1 className="h3 mb-0 ms-2">
              Ngày của roadmap: {roadmap?.levelName || roadmapId}
            </h1>
          </div>
          <p className="text-muted mb-0">Manage days visually</p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={loadRoadmap}>Refresh</button>
          <button className="btn btn-primary" onClick={openAdd}>Thêm ngày</button>
        </div>
      </div>

      {/* GRID */}
      <div
        className="month-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${ROWS_PER_ROW}, 1fr)`,
          gap: GAP,
          padding: 8,
          // giữ cho grid cao theo nội dung hàng — nhưng chúng ta override height khi cần
          gridAutoRows: 'min-content',
          alignContent: 'start',
          // nếu có rowCount > 0 thì ép chiều cao container = gridHeight
          height: gridHeight !== undefined ? `${gridHeight}px` : undefined,
        }}
      >
        {days.map((d) => {
          const num = Number(d.dayNumber);

          return (
            <div
              key={num}
              className="month-day card p-0"
              onDoubleClick={() => openAddAt(num)}
              onClick={() => navigate(`/admin/days/${d.id}/activities`)}
              onMouseEnter={() => setHoveredDay(num)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                background: '#002b36',
                // giữ chiều cao ô như bạn muốn
                minHeight: DAY_HEIGHT,
                display: 'flex',
                cursor: 'pointer',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                color: '#fff',
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                transform: hoveredDay === num ? "scale(1.06)" : "scale(1)",
                boxShadow:
                  hoveredDay === num
                    ? "0 10px 20px rgba(0,0,0,0.35)"
                    : "0 2px 8px rgba(0,0,0,0.15)",
                zIndex: hoveredDay === num ? 5 : 1,
              }}
            >
              {/* DESCRIPTION HOVER */}
              {hoveredDay === num && d?.description && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-8px)',
                    background: 'rgba(0,0,0,0.85)',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: 8,
                    width: 240,
                    textAlign: 'center',
                    fontSize: 14,
                    zIndex: 999,
                    whiteSpace: 'normal',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    pointerEvents: 'none'
                  }}
                >
                  {d.description}
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: '8px solid rgba(0,0,0,0.85)'
                    }}
                  />
                </div>
              )}

              {/* ICONS */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  display: "flex",
                  gap: 4,
                  pointerEvents: "auto"
                }}
              >
                <button
                  className="btn btn-sm btn-light p-1"
                  style={{ width: 26, height: 26 }}
                  onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                >
                  <i className="bi bi-pencil" style={{ fontSize: 14 }} />
                </button>

                <button
                  className="btn btn-sm btn-danger p-1"
                  style={{ width: 26, height: 26 }}
                  onClick={(e) => { e.stopPropagation(); deleteDay(d); }}
                >
                  <i className="bi bi-trash" style={{ fontSize: 14 }} />
                </button>
              </div>

              {/* BLUE DAY CIRCLE */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #003b48, #002b36)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `
                      0 0 0 3px #2af5d2 inset,
                      0 0 0 6px #1fbfa1 inset,
                      0 0 12px rgba(42,245,210,0.6)
                    `,
                  color: "#fff",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: 1 }}>
                  DAY
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: -2 }}>
                  {num}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modal.type && (
      <div
        className="modal-backdrop"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050
        }}
      >
        <div className="modal-dialog" style={{ maxWidth: 600, width: '100%' }}>
          <div
            className="modal-content p-3"
            style={{
              background: "#ffffff",
              color: "#000000",
              borderRadius: 12,
              border: "1px solid #ccc",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          >
            <h5 className="mb-3" style={{ color: "#000", fontWeight: 700 }}>
              {modal.type === 'add' ? 'Thêm ngày' : 'Sửa ngày'}
            </h5>

            <div className="mb-2">
              <label className="form-label" style={{ color: "#000" }}>Số ngày</label>
              <input
                className="form-control"
                type="number"
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  color: "#000"
                }}
                value={form.dayNumber}
                onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))}
              />
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ color: "#000" }}>Mô tả</label>
              <textarea
                className="form-control"
                rows={3}
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  color: "#000"
                }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="mb-2">
              <label className="form-label" style={{ color: "#000" }}>Condition (số)</label>
              <input
                className="form-control"
                type="number"
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  color: "#000"
                }}
                value={form.condition}
                onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
              />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={closeModal}>
                Huỷ
              </button>
              <button className="btn btn-primary" onClick={saveDay}>
                Lưu
              </button>
            </div>

          </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default RoadmapDaysPage;
