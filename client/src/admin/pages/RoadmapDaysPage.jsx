import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { ThemeContext } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

const emptyForm = { dayNumber: '', theme: '', description: '', condition: '' };

const ROWS_PER_ROW = 7;      // số cột
const DAY_HEIGHT = 170;      // chiều cao ô day (giữ nguyên như bạn muốn)
const GAP = 16;              // gap giữa ô (giống style trước)

const RoadmapDaysPage = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [roadmap, setRoadmap] = useState(null);
  const [days, setDays] = useState([]);
  const [modal, setModal] = useState({ type: null, payload: null });
  const [form, setForm] = useState(emptyForm);
  const [roadmapForm, setRoadmapForm] = useState({ levelName: '', description: '', freeDayCount: 0 });
  const [hoveredDay, setHoveredDay] = useState(null);

  const { isDarkMode } = useContext(ThemeContext);

  const loadRoadmap = useCallback(async () => {
    try {
      const res = await api.get(`/roadmaps/${roadmapId}`);
      const data = res.data;
      setRoadmap(data);
      setRoadmapForm({
        levelName: data.levelName || '',
        description: data.description || '',
        freeDayCount: data.freeDayCount ?? 0
      });

      const sorted = (data.days || []).sort(
        (a, b) => Number(a.dayNumber) - Number(b.dayNumber)
      );

      setDays(sorted);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || String(err));
    }
  }, [roadmapId, toast]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const openAdd = () => {
    setForm(emptyForm);
    setModal({ type: 'add', payload: null });
  };

  const openUpdateRoadmap = () => {
    setModal({ type: 'update_roadmap', payload: roadmap });
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
        dayNumber: Number(form.dayNumber),
        description: form.description,
        condition: form.condition ? Number(form.condition) : undefined
      };

      await api.post(`/roadmaps/${roadmapId}/days`, body);
      closeModal();
      loadRoadmap();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || String(err));
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
      toast.error(err?.response?.data?.message || err?.message || String(err));
    }
  };

  const updateRoadmap = async () => {
    try {
      const body = {
        ...roadmapForm,
        freeDayCount: Number(roadmapForm.freeDayCount)
      };
      await api.put(`/roadmaps/${roadmapId}`, body);
      toast.success("Cập nhật roadmap thành công");
      closeModal();
      loadRoadmap();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || String(err));
    }
  };

  const saveDay = async () => {
    if (modal.type === "add") return createDay();
    if (modal.type === "edit") return updateDay();
    if (modal.type === "update_roadmap") return updateRoadmap();
  };

  const deleteDay = async (day) => {
    const confirmed = await toast.confirm(`Xác nhận xoá ngày ${day.dayNumber}?`, { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
    if (!confirmed) return;

    try {
      await api.delete(`/days/${day.id}`);
      loadRoadmap();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || String(err));
    }
  };

  // --- Tính chiều cao container dynamic ---
  const rowCount = days.length === 0 ? 0 : Math.ceil(days.length / ROWS_PER_ROW);
  // Nếu rowCount === 0, để undefined để grid fit nội dung (không chiếm chỗ)
  const gridHeight =
    rowCount > 0
      ? rowCount * DAY_HEIGHT + (rowCount - 1) * GAP // rows * rowHeight + gaps giữa hàng
      : undefined;


  const dayColors = {
    light: {
      background: "#e8f4ff",      // xanh nhạt
      text: "#005b99",
      circleBg: "#e8f4ff",
      circleShadow: `
        0 0 0 3px #90d8ff inset,
        0 0 0 6px #64bbf5 inset,
        0 0 12px rgba(80,170,255,0.4)
      `
    },

    dark: {
      background: "#002b36",
      text: "#fff",
      circleBg: "radial-gradient(circle, #003b48, #002b36)",
      circleShadow: `
        0 0 0 3px #2af5d2 inset,
        0 0 0 6px #1fbfa1 inset,
        0 0 12px rgba(42,245,210,0.6)
      `
    }
  };


  return (
    <div>
      <div className="container p-4">
        <div className="d-flex flex-column gap-3 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className="btn btn-secondary me-3"
                onClick={() => navigate(-1)}
              >
                Back
              </button>

              <h2 className="mb-0">
                Quản lý ngày của roadmap: {roadmap?.levelName || roadmapId}
              </h2>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2">
            {roadmap && (
              <span className="badge bg-info me-auto fs-6" style={{ padding: '8px 12px' }}>
                Miễn phí: {roadmap.freeDayCount === -1 ? 'Tất cả' : `${roadmap.freeDayCount} ngày đầu`}
              </span>
            )}
            <button className="btn btn-outline-primary" onClick={loadRoadmap}>Refresh</button>
            <button className="btn btn-warning" onClick={openUpdateRoadmap}>Cấu hình học thử</button>
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
            const theme = isDarkMode ? dayColors.dark : dayColors.light;

            return (
              <div
                key={num}
                className="month-day card p-0"
                onDoubleClick={() => openAddAt(num)}
                onClick={() => navigate(`/admin/days/${d.id}/activities`)}
                onMouseEnter={() => setHoveredDay(num)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  background: theme.background,
                  minHeight: DAY_HEIGHT,
                  display: 'flex',
                  cursor: 'pointer',
                  borderRadius: 8,
                  overflow: 'hidden',
                  position: 'relative',
                  color: theme.text,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  transform: hoveredDay === num ? "scale(1.06)" : "scale(1)",
                  boxShadow:
                    hoveredDay === num
                      ? "0 10px 20px rgba(0,0,0,0.35)"
                      : "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: hoveredDay === num ? 5 : 1,
                }}
              >
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

                {/* CIRCLE */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: theme.circleBg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: theme.circleShadow,
                    color: theme.text,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: 1 }}>
                    DAY
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: -2 }}>
                    {num}
                  </div>
                </div>

                {/* VIP INDICATOR (Diamond) */}
                {roadmap && roadmap.freeDayCount !== -1 && num > roadmap.freeDayCount && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      filter: "drop-shadow(0 2px 4px rgba(255,152,0,0.5))",
                      zIndex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255, 152, 0, 0.15)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 152, 0, 0.3)",
                      color: "#FF9800",
                      fontWeight: "bold",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      marginTop: "15px"
                    }}
                  >
                    <span style={{ fontSize: "16px", marginRight: "4px" }}>💎</span> Unlock
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODAL */}
        {modal.type && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: "rgba(0,0,0,0.45)", zIndex: 9999 }}
          >
            <div >
              <div
                className="card shadow p-4" style={{ width: 600 }}
              >
                {modal.type === 'update_roadmap' ? (
                  <>
                    <h5 className="mb-4 text-primary">Thiết lập quyền truy cập (Free/VIP)</h5>

                    <div className="mb-4">
                      <label className="form-label fw-bold d-block mb-3">Chế độ truy cập:</label>
                      <div className="d-flex gap-4">
                        <div className="form-check custom-radio">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accessType"
                            id="accessFree"
                            checked={Number(roadmapForm.freeDayCount) === -1}
                            onChange={() => setRoadmapForm(f => ({ ...f, freeDayCount: -1 }))}
                          />
                          <label className="form-check-label px-2" htmlFor="accessFree">
                            <span className="badge bg-success-subtle text-success fs-6">Miễn phí hoàn toàn</span>
                          </label>
                        </div>
                        <div className="form-check custom-radio">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accessType"
                            id="accessTrial"
                            checked={Number(roadmapForm.freeDayCount) !== -1}
                            onChange={() => setRoadmapForm(f => ({ ...f, freeDayCount: roadmap?.freeDayCount === -1 ? 0 : roadmap?.freeDayCount }))}
                          />
                          <label className="form-check-label px-2" htmlFor="accessTrial">
                            <span className="badge bg-warning-subtle text-warning fs-6">Học thử giới hạn</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {Number(roadmapForm.freeDayCount) !== -1 && (
                      <div className="mb-3 animate__animated animate__fadeIn">
                        <label className="form-label fw-semibold">Số ngày cho phép học miễn phí:</label>
                        <div className="input-group">
                          <input
                            className="form-control border-primary"
                            type="number"
                            min="0"
                            placeholder="Ví dụ: 5"
                            value={roadmapForm.freeDayCount}
                            onChange={e => setRoadmapForm(f => ({ ...f, freeDayCount: e.target.value }))}
                          />
                          <span className="input-group-text bg-primary text-white">Ngày</span>
                        </div>
                        <small className="text-muted mt-2 d-block">
                          <i className="bi bi-info-circle me-1"></i>
                          Học sinh chỉ học được X ngày đầu, sau đó phải mua gói để tiếp tục.
                        </small>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h5 className="mb-3">
                      {modal.type === 'add' ? 'Thêm ngày' : 'Sửa ngày'}
                    </h5>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Số ngày</label>
                      <input
                        className="form-control"
                        type="number"
                        value={form.dayNumber}
                        onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Mô tả</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Condition (số)</label>
                      <input
                        className="form-control"
                        type="number"
                        value={form.condition}
                        onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                      />
                    </div>
                  </>
                )}

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
    </div>
  );
};

export default RoadmapDaysPage;
