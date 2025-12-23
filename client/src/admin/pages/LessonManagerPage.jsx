import React, { useCallback, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from '../../api/api';
import lessonTopicEnum from "../../enums/lessonTopic.enum";
import { useToast } from '../../context/ToastContext';

const LessonManagerPage = ()=> {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 lessons per page
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null => create, object => edit

  const [form, setForm] = useState({
    title: '',
    video_url: '',
    thumbnail_url: '',
    topic_type: '', // new
    level: '' // new
  });

  // NEW: store selected SRT file
  const [srtFile, setSrtFile] = useState(null);

  const [srtModalOpen, setSrtModalOpen] = useState(false); // new
  const [srtData, setSrtData] = useState([]); // new: array of { start_time, full_text }

  const fetchLessons = useCallback(async (p, lim) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/lessons?page=${p}&limit=${lim}`);
      const payload = res.data;
      console.debug("Raw lessons response:", payload);

      let items = [];
      let totalCount = 0;

      // preferred shaped response { data, total, page, limit }
      if (payload) {
        if (Array.isArray(payload.data)) {
          items = payload.data;
          totalCount = Number(payload.total) || 0;
        } else if (Array.isArray(payload.items)) {
          items = payload.items;
          totalCount = Number(payload.total) || 0;
        } else if (Array.isArray(payload.lessons)) {
          items = payload.lessons;
          totalCount = Number(payload.total) || items.length;
        } else if (Array.isArray(payload)) {
          items = payload;
          totalCount = items.length;
        } else {
          // fallback: try to find first array value on the object
          const firstArray = Object.values(payload).find(v => Array.isArray(v));
          if (firstArray) {
            items = firstArray;
            totalCount = Number(payload.total) || items.length;
          }
        }
      }

      setLessons(items || []);
      setTotal(totalCount || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLessons(page, limit); }, [fetchLessons, page, limit]);

  const openCreate = () => {
    setEditing(null);
    // default topic_type to human-readable label "Movie short clip"
    setForm({ title: '', video_url: '', thumbnail_url: '', topic_type: getTopicLabel('movie-short-clip'), level: '' });
    setSrtFile(null);
    setShowModal(true);
  };

  const openEdit = (lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title || '',
      video_url: lesson.video_url || '',
      thumbnail_url: lesson.thumbnail_url || '',
      // ensure we store the human-readable label in the form
      topic_type: getTopicLabel(lesson.topic_type ?? ''),
      level: lesson.level ?? ''
    });
    setSrtFile(null); // don't pre-fill file
    setShowModal(true);
  };

  const handleDelete = async (lesson) => {
    const confirmed = await toast.confirm(`Xóa lesson "${lesson.title}"?`, { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
    if (!confirmed) return;
    try {
      await api.delete(`/lessons/${lesson.id}`);
      // refresh current page
      fetchLessons(page, limit);
    } catch (err) {
      console.error(err);
      toast.error('Xóa thất bại');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // CREATE: require SRT file; UPDATE: optional
    if (!editing && !srtFile) {
      toast.warning("Vui lòng upload file .srt.");
      return;
    }

    try {
      // Build FormData for multipart request (supports srt file upload)
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('video_url', form.video_url);
      formData.append('thumbnail_url', form.thumbnail_url);
      formData.append('topic_type', form.topic_type);
      formData.append('level', form.level);

      // If an SRT file selected, append it (optional)
      if (srtFile) {
        formData.append('srt_file', srtFile, srtFile.name);
      }

      if (editing && editing.id) {
        // Use PUT for update; FormData is OK with axios
        await api.put(`/lessons/${editing.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post('/lessons', formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setShowModal(false);
      // go back to page 1 after create or refresh current after edit
      if (editing && editing.id) fetchLessons(page, limit);
      else { setPage(1); fetchLessons(1, limit); }
    } catch (err) {
      console.error(err);
      const message =
      err?.response?.data?.message ||
      err?.message ||
      'Lưu thất bại';

    // Nếu message có nhiều dòng -> lấy dòng đầu tiên
    const firstMessage = message.split('\n')[0];
    toast.error(firstMessage);
    }
  };

  // --- NEW: fetch and show SRT subtitles for a lesson ---
  const viewSrt = async (lessonId) => {
    try {
      const res = await api.get(`/lessons/${lessonId}`);
      const lessonPayload = res.data?.lesson ?? res.data;
      const subs = lessonPayload?.subtitles ?? [];
      setSrtData(subs);
      setSrtModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch lesson subtitles", err);
      toast.error("Không thể tải phụ đề");
    }
  };

  // --- NEW: small URL helpers for previewing ---
  const isValidUrl = (str) => {
    try { new URL(str); return true; } catch { return false; }
  };
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const isImageUrl = (url) => !!url && /\.(jpe?g|png|gif|webp)(?:\?.*)?$/i.test(url);
  const isVideoFile = (url) => !!url && /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(url);

  // helper: return human-readable label for a topic value or key
  const getTopicLabel = (value) => {
    if (!value) return "";
    // if already a label
    if (Object.values(lessonTopicEnum).includes(value)) return value;
    // if key, map to label
    if (lessonTopicEnum[value]) return lessonTopicEnum[value];
    return value;
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <h3 className="me-auto">Admin — Lesson Management</h3>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-2"></i>New Lesson</button>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="mb-2">
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Video URL</th>
                <th>Thumbnails</th>
                <th>Topic Type</th>
                <th>Level</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l, i) => (
                <tr key={l.id ?? i}>
                  <td>{i + 1}</td>
                  <td style={{maxWidth: 240}}><strong>{l.title}</strong></td>
                  <td style={{maxWidth: 300, wordBreak: 'break-all'}}><a href={l.video_url} target="_blank" rel="noreferrer">{l.video_url}</a></td>
                  <td>{l.thumbnail_url ? <img src={l.thumbnail_url} alt="" style={{width:80}}/> : '—'}</td>
                  <td style={{maxWidth: 160}}>{lessonTopicEnum[l.topic_type] ?? l.topic_type ?? '—'}</td>
                  <td style={{maxWidth: 120}}>{l.level ?? '—'}</td>
                  <td className="text-end">
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(l)}><i className="bi bi-pencil"></i></button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => viewSrt(l.id)} title="View SRT"><i className="bi bi-file-earmark-text"></i></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(l)}><i className="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted">No lessons</td></tr>
              )}
            </tbody>
          </table>
          {/* Pagination controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">Total: {total}</div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                </li>
                {Array.from({ length: Math.max(1, Math.ceil(total / limit)) }).map((_, idx) => {
                  const pnum = idx + 1;
                  return (
                    <li key={pnum} className={`page-item ${pnum === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(pnum)}>{pnum}</button>
                    </li>
                  );
                })}
                <li className={`page-item ${page >= Math.ceil(total / limit) ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.min(Math.ceil(total / limit) || 1, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{editing ? 'Edit Lesson' : 'Create Lesson'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  <label className="form-label">Title</label>
                  <input className="form-control" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>

                <div className="mb-2">
                  <label className="form-label">Video URL</label>
                  <input className="form-control" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} />
                </div>

                <div className="mb-3">
                  {form.video_url && isValidUrl(form.video_url) && (
                    <div>
                      <div className="small text-muted mb-1">Video preview</div>
                      {extractYouTubeId(form.video_url) ? (
                        <div style={{ width: '100%', maxWidth: 560 }}>
                          <iframe
                            title="video-preview"
                            width="100%"
                            height="315"
                            src={`https://www.youtube.com/embed/${extractYouTubeId(form.video_url)}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : isVideoFile(form.video_url) ? (
                        <video src={form.video_url} controls style={{ maxWidth: 560, width: '100%', borderRadius: 6 }} />
                      ) : (
                        <div className="text-muted small">No preview available for this URL</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">Thumbnail URL</label>
                  <input className="form-control" value={form.thumbnail_url} onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
                </div>

                {/* Preview area: thumbnail image + video preview (YouTube embed or HTML5 video) */}
                <div className="mb-3">
                  {form.thumbnail_url && isValidUrl(form.thumbnail_url) && isImageUrl(form.thumbnail_url) && (
                    <div className="mb-2">
                      <div className="small text-muted mb-1">Thumbnail preview</div>
                      <img src={form.thumbnail_url} alt="thumbnail preview" style={{ maxWidth: 320, maxHeight: 180, objectFit: 'cover', borderRadius: 6 }} />
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label className="form-label">Topic Type</label>
                    <select
                      className="form-select"
                      value={form.topic_type}
                      onChange={e => setForm({...form, topic_type: e.target.value})}
                    >
                      <option value="">Select topic type</option>
                      {Object.entries(lessonTopicEnum).map(([key, label]) => (
                        // use label as the option value so form.topic_type holds the human-readable label
                        <option key={key} value={label}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-2">
                    <label className="form-label">Level</label>
                    <input className="form-control" value={form.level} onChange={e => setForm({...form, level: e.target.value})} placeholder="A1, A2,..." />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label">SRT File (upload .srt)</label>
                  <input
                    className="form-control"
                    type="file"
                    accept=".srt"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      setSrtFile(f || null);
                    }}
                  />
                  <div className="form-text">
                    When creating a lesson, an SRT file is required. When editing, uploading an SRT is optional and will replace existing subtitles.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW: SRT viewer modal --- */}
      {srtModalOpen && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">SRT Subtitles</h5>
                <button type="button" className="btn-close" onClick={() => setSrtModalOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {srtData.length === 0 ? (
                  <div className="text-muted">No subtitles available</div>
                ) : (
                  <div className="list-group">
                    {srtData.map((s, idx) => (
                      <div key={s.id ?? idx} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div className="text-muted small">{s.start_time ?? s.startTime ?? ''} - {s.end_time ?? s.endTime ?? ''}</div>
                          <div className="text-muted small">#{s.index ?? (idx+1)}</div>
                        </div>
                        <div style={{marginTop:6}}>{s.full_text ?? s.text ?? ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSrtModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonManagerPage;
