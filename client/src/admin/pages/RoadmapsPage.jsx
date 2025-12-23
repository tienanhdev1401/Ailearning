import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

import { Editor } from '@tinymce/tinymce-react';

const DEFAULT_ITEMS_PER_PAGE = 8;

const emptyForm = {
  levelName: '',
  description: '',
  overview: ""
};

const normalizeServerRoadmap = (r) => ({
  id: r.id,
  levelName: r.levelName || 'Không tên',
  description: r.description || '—',
  overview: r.overview || "",
  daysCount: Array.isArray(r.days) ? r.days.length : 0,
  startedAt: r.startedAt || r.createdAt || null,
  updatedAt: r.updatedAt || null
});

const RoadmapsPage = () => {
  const toast = useToast();
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');

  // SORT — chỉ dùng để đọc, không set
  const [sortField] = useState('levelName');
  const [sortDirection] = useState('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [modalState, setModalState] = useState({ type: null, payload: null });
  const [form, setForm] = useState(emptyForm);

  const { isDarkMode } = useContext(ThemeContext);

  // LOAD ROADMAPS
  const loadRoadmaps = useCallback(async (page = 1, limit = itemsPerPage) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/roadmaps', { params: { page, limit } });
      const payload = res.data;

      const list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      const items = Array.isArray(list) ? list.map(normalizeServerRoadmap) : [];

      setRoadmaps(prev => (page === 1 ? items : [...prev, ...items]));
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err.message ||
        String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // AUTO LOAD FIRST PAGE
  useEffect(() => {
    loadRoadmaps(currentPage, itemsPerPage);
  }, [loadRoadmaps, currentPage, itemsPerPage]);

  // SEARCH HANDLER
  useEffect(() => {
    const fetchAll = async () => {
      setRoadmaps([]);
      setCurrentPage(1);
      setLoading(true);
      setError(null);

      try {
        const first = await api.get('/roadmaps', {
          params: { page: 1, limit: itemsPerPage }
        });

        const payload1 = first.data;
        const list1 = Array.isArray(payload1)
          ? payload1
          : payload1?.data || [];

        const items1 = list1.map(normalizeServerRoadmap);
        let all = items1;

        const serverTotal1 = payload1?.total
          ? Number(payload1.total)
          : Array.isArray(payload1)
          ? payload1.length
          : 0;

        const pages = serverTotal1
          ? Math.max(1, Math.ceil(serverTotal1 / itemsPerPage))
          : 1;
        setTotalPages(pages);

        for (let p = 2; p <= pages; p++) {
          const res = await api.get('/roadmaps', {
            params: { page: p, limit: itemsPerPage }
          });

          const payload = res.data;
          const list = Array.isArray(payload)
            ? payload
            : payload?.data || [];

          const items = list.map(normalizeServerRoadmap);
          all = [...all, ...items];

          setRoadmaps([...all]);
        }

        setRoadmaps(all);
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (search.trim().length > 0) {
      fetchAll();
    } else {
      setRoadmaps([]);
      setCurrentPage(1);
      loadRoadmaps(1, itemsPerPage);
    }
  }, [search, loadRoadmaps, itemsPerPage]);

  // INFINITE SCROLL
  useEffect(() => {
    const onScroll = () => {
      if (loading) return;
      if (currentPage >= totalPages) return;

      const threshold = 300;
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - threshold;

      if (scrolledToBottom) setCurrentPage(p => p + 1);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, currentPage, totalPages]);

  // FILTER + SORT
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...roadmaps];

    if (q) {
      list = list.filter(
        r =>
          r.levelName.toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q)
      );
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
    setForm({
      levelName: r.levelName,
      description: r.description,
      overview: r.overview
    });
    setModalState({ type: 'edit', payload: r });
  };

  const closeModal = () => setModalState({ type: null, payload: null });

  const saveRoadmap = async () => {
    try {
      const body = {
        levelName: form.levelName,
        description: form.description,
        overview: form.overview
      };

      if (modalState.type === 'add') {
        await api.post('/roadmaps', body);
      } else if (modalState.type === 'edit') {
        await api.put(`/roadmaps/${modalState.payload.id}`, body);
      }

      closeModal();
      setRoadmaps([]);
      setCurrentPage(1);
      await loadRoadmaps(1, itemsPerPage);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || String(err);
      toast.error(message || 'Error');
    }
  };

  const deleteRoadmap = async (r) => {
    const confirmed = await toast.confirm(`Xác nhận xoá roadmap "${r.levelName}"?`, { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
    if (!confirmed) return;

    try {
      await api.delete(`/roadmaps/${r.id}`);
      setRoadmaps([]);
      setCurrentPage(1);
      await loadRoadmaps(1, itemsPerPage);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || String(err);
      toast.error(message || 'Error');
    }
  };

  // RENDER UI
  return (
    <div className="bg-body text-body min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="ms-5">Quản lý Roadmaps</h4>
        <button className="btn btn-primary me-2" onClick={openAdd}>
          Tạo roadmap
        </button>
      </div>

      <div className="card mb-3 bg-body border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Tìm kiếm theo tên hoặc mô tả"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-8 text-end">
              <small className="text-muted">Tổng roadmap: {roadmaps.length}</small>
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className={`card bg-body shadow-sm ${isDarkMode ? 'border border-light' : 'border-0'}`}>
        <div className="card-body">
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="text-danger">{error}</div>
          ) : (
            <div className="row g-3" >
              {paginated.map(r => (
                <div key={r.id} className="col-xl-3 col-lg-3 col-md-6 col-sm-12">
                  <div className={`card h-100 bg-body ${isDarkMode ? 'border border-light' : 'border border-secondary-subtle'}`}>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title text-truncate" title={r.levelName}>
                        {r.levelName}
                      </h5>

                      <p
                        className="card-text text-muted small mb-2"
                        style={{ flex: 1, overflow: 'hidden' }}
                      >
                        {r.description}
                      </p>

                      <div className="mt-3 d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary w-100"
                          onClick={() => navigate(`/admin/roadmaps/${r.id}/days`)}
                        >
                          Quản lý ngày
                        </button>

                        <div className="w-100 d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary w-50"
                            onClick={() => openEdit(r)}
                          >
                            Xem
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger w-50"
                            onClick={() => deleteRoadmap(r)}
                          >
                            Xoá
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {paginated.length === 0 && (
                <div className="col-12 text-center py-4">
                  Không có roadmap
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalState.type && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">

              {/* HEADER */}
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalState.type === 'add'
                    ? 'Tạo Roadmap'
                    : 'Cập nhật Roadmap'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeModal}
                ></button>
              </div>

              {/* BODY */}
              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label">Tên</label>
                  <input
                    className="form-control"
                    value={form.levelName}
                    onChange={e =>
                      setForm(f => ({ ...f, levelName: e.target.value }))
                    }
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={form.description}
                    onChange={e =>
                      setForm(f => ({ ...f, description: e.target.value }))
                    }
                  />

                 <label className="form-label pt-3">Over view</label>
                  <Editor
                    apiKey="5h1mny4wdy7lwto04bpgonbbj9ymfa8bmjxmmjiee045hxq7" 
                    value={form.overview}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: 'lists table paste link image code',
                      toolbar:
                        'undo redo | bold italic underline | bullist numlist | table | link image | alignleft aligncenter alignright | code',

                      // Auto clean Word formatting
                      paste_data_images: false,
                      paste_as_text: false,
                      paste_webkit_styles: "bold italic underline",
                      paste_merge_formats: true,
                      paste_convert_word_fake_lists: true,
                      paste_retain_style_properties: "color font-size",

                      content_style:
                        "body { font-family: Arial, sans-serif; font-size: 14px; background: transparent; }"
                    }}

                    onEditorChange={(content) => {
                      setForm((f) => ({ ...f, overview: content }));
                    }}
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Huỷ
                </button>
                <button className="btn btn-primary" onClick={saveRoadmap}>
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

export default RoadmapsPage;
