import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

// itemsPerPage fixed to 8 as requested
const DEFAULT_ITEMS_PER_PAGE = 8;

const emptyForm = {
  levelName: '',
  description: ''
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
};

const normalizeServerRoadmap = (r) => ({
  id: r.id,
  levelName: r.levelName || 'Không tên',
  description: r.description || '—',
  daysCount: Array.isArray(r.days) ? r.days.length : 0,
  startedAt: r.startedAt || r.createdAt || null,
  updatedAt: r.updatedAt || null
});

const RoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('levelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalState, setModalState] = useState({ type: null, payload: null });
  const [form, setForm] = useState(emptyForm);

  const loadRoadmaps = useCallback(async (page = 1, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/roadmaps', { params: { page, limit, q: search, sortField, sortDir: sortDirection } });
      const payload = res.data;

      // payload can be either array or paged object { data, total, page, limit }
      const list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      const items = Array.isArray(list) ? list.map(normalizeServerRoadmap) : [];

      // If page === 1, replace; else append for infinite scroll
      setRoadmaps(prev => (page === 1 ? items : [...prev, ...items]));

      // update total & totalPages when server provides it
      const serverTotal = payload && payload.total ? Number(payload.total) : (Array.isArray(payload) ? payload.length : 0);
      setTotal(serverTotal);
      const pages = serverTotal && limit ? Math.max(1, Math.ceil(serverTotal / limit)) : 1;
      setTotalPages(pages);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || err.message || String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, search, sortField, sortDirection]);

  useEffect(() => {
    loadRoadmaps(currentPage, itemsPerPage);
  }, [loadRoadmaps, currentPage, itemsPerPage]);

  // reset and reload when search changes
  useEffect(() => {
    // If user types a search, load ALL pages from server (so we can filter locally)
    // This avoids sending a `q` param to the server. Be aware: this may produce many requests
    // if the dataset is large. We load sequentially to avoid overwhelming the server.
    const fetchAll = async () => {
      setRoadmaps([]);
      setCurrentPage(1);
      setLoading(true);
      setError(null);
      try {
        // load first page to get totalPages
        const first = await api.get('/roadmaps', { params: { page: 1, limit: itemsPerPage } });
        const payload1 = first.data;
        const list1 = Array.isArray(payload1) ? payload1 : (payload1 && payload1.data) || [];
        const items1 = Array.isArray(list1) ? list1.map(normalizeServerRoadmap) : [];
        let all = items1;
        const serverTotal1 = payload1 && payload1.total ? Number(payload1.total) : (Array.isArray(payload1) ? payload1.length : 0);
        const pages = serverTotal1 && itemsPerPage ? Math.max(1, Math.ceil(serverTotal1 / itemsPerPage)) : 1;
        setTotal(serverTotal1);
        setTotalPages(pages);

        // fetch remaining pages sequentially
        for (let p = 2; p <= pages; p++) {
          const res = await api.get('/roadmaps', { params: { page: p, limit: itemsPerPage } });
          const payload = res.data;
          const list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
          const items = Array.isArray(list) ? list.map(normalizeServerRoadmap) : [];
          all = [...all, ...items];
          // optional: update immediate UI as pages come in
          setRoadmaps([...all]);
        }
        // final set
        setRoadmaps(all);
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (search && search.trim().length > 0) {
      fetchAll();
    } else {
      // clear and reload first page when search cleared
      setRoadmaps([]);
      setCurrentPage(1);
      loadRoadmaps(1, itemsPerPage);
    }
  }, [search]);

  // infinite scroll: load next page when near bottom
  useEffect(() => {
    const onScroll = () => {
      if (loading) return;
      // if we've loaded all pages, do nothing
      if (currentPage >= totalPages) return;
      const threshold = 300; // px from bottom
      const scrolledToBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
      if (scrolledToBottom) {
        setCurrentPage(p => p + 1);
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, currentPage, totalPages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = roadmaps.slice();
    if (q) {
      list = list.filter(r => (
        r.levelName.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      ));
    }
    list.sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [roadmaps, search, sortField, sortDirection]);

  const paginated = filtered;



  const navigate = useNavigate();

  const openAdd = () => {
    setForm(emptyForm);
    setModalState({ type: 'add', payload: null });
  };

  const openEdit = (r) => {
    setForm({ levelName: r.levelName, description: r.description });
    setModalState({ type: 'edit', payload: r });
  };

  const closeModal = () => setModalState({ type: null, payload: null });

  const saveRoadmap = async () => {
    try {
      const body = { levelName: form.levelName, description: form.description };
      if (modalState.type === 'add') {
        await api.post('/roadmaps', body);
      } else if (modalState.type === 'edit') {
        const id = modalState.payload.id;
        await api.put(`/roadmaps/${id}`, body);
      }
      closeModal();
      // reload from first page after changes
      setRoadmaps([]);
      setCurrentPage(1);
      await loadRoadmaps(1, itemsPerPage);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || String(err);
      alert(message || 'Error');
    }
  };

  const deleteRoadmap = async (r) => {
    if (!window.confirm(`Xác nhận xoá roadmap "${r.levelName}"?`)) return;
    try {
      await api.delete(`/roadmaps/${r.id}`);
      // reload from first page after deletion
      setRoadmaps([]);
      setCurrentPage(1);
      await loadRoadmaps(1, itemsPerPage);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || String(err);
      alert(message || 'Error');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 class="ms-5">Quản lý Roadmaps</h4>
        <div>
          <button className="btn btn-primary me-2" onClick={openAdd}>Tạo roadmap</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Tìm kiếm theo tên hoặc mô tả" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-8 text-end">
              <small className="text-muted">Tổng roadmap: {roadmaps.length}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="text-danger">{error}</div>
          ) : (
            <div className="row g-3">
              {paginated.map(r => (
                <div key={r.id} className="col-xl-3 col-lg-3 col-md-6 col-sm-12">
                  <div className="card h-100">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate" title={r.levelName}>{r.levelName}</h5>
                      <p className="card-text text-muted small mb-2" style={{ flex: 1, overflow: 'hidden' }}>{r.description}</p>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">{formatDateTime(r.startedAt)}</small>
                      </div>
                      <div className="mt-3 d-flex gap-2">
                        <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => navigate(`/admin/roadmaps/${r.id}/days`)}>Quản lý ngày</button>
                        <div className="w-100 d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary w-50" onClick={() => openEdit(r)}>Sửa</button>
                          <button className="btn btn-sm btn-outline-danger w-50" onClick={() => deleteRoadmap(r)}>Xoá</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {paginated.length === 0 && (
                <div className="col-12 text-center py-4">Không có roadmap</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalState.type && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalState.type === 'add' ? 'Tạo Roadmap' : 'Cập nhật Roadmap'}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tên</label>
                  <input className="form-control" value={form.levelName} onChange={e => setForm(f => ({ ...f, levelName: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-control" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Huỷ</button>
                <button className="btn btn-primary" onClick={saveRoadmap}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapsPage;
