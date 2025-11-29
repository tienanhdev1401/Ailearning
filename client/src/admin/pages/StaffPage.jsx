import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import userService from '../../services/userService';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'inactive', label: 'Ngưng' }
];

const STATUS_VARIANTS = {
  active: 'bg-success',
  pending: 'bg-warning text-dark',
  inactive: 'bg-secondary'
};

const STATUS_LABELS = {
  active: 'Hoạt động',
  pending: 'Chờ duyệt',
  inactive: 'Ngưng'
};

const emptyForm = {
  fullname: '',
  email: '',
  phone: '',
  status: 'active'
};

const mapServerStatus = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'VERIFIED':
    case 'ACTIVE':
      return 'active';
    case 'UNVERIFIED':
    case 'PENDING':
      return 'pending';
    case 'SUSPENDED':
    case 'INACTIVE':
      return 'inactive';
    default:
      return 'active';
  }
};

const mapClientStatusToServer = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'VERIFIED';
    case 'pending':
      return 'PENDING';
    case 'inactive':
      return 'SUSPENDED';
    default:
      return 'VERIFIED';
  }
};

const normalizeStaffMember = (user) => ({
  id: user.id,
  fullname: user.name || 'Chưa rõ tên',
  email: user.email || 'Chưa có email',
  status: mapServerStatus(user.status),
  phone: user.phone || '—',
  joinedAt: user.startedAt || user.createdAt || new Date().toISOString(),
  // Lưu thông tin đầy đủ để có thể update
  role: user.role || 'staff',
  avatarUrl: user.avatarUrl || null,
  birthday: user.birthday || null,
  gender: user.gender || null
});

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch (error) {
    console.error('Failed to format date', error);
    return 'Chưa cập nhật';
  }
};

const StaffPage = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalState, setModalState] = useState({ open: false, payload: null });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      const normalized = Array.isArray(data)
        ? data.filter((user) => user.role === 'staff').map(normalizeStaffMember)
        : [];
      setStaffMembers(normalized);
      setError(null);
    } catch (fetchError) {
      setError(fetchError.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return staffMembers.filter((member) => {
      const matchesKeyword =
        keyword.length === 0 ||
        member.fullname.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [staffMembers, search, statusFilter]);

  const handleDelete = async (member) => {
    if (!window.confirm(`Xóa nhân viên ${member.fullname}?`)) return;
    try {
      await userService.deleteUser(member.id);
      setStaffMembers((prev) => prev.filter((item) => item.id !== member.id));
    } catch (deleteError) {
      window.alert(deleteError.message || 'Không thể xóa nhân viên. Vui lòng thử lại.');
    }
  };

  const handleSave = async (formValues, editingId) => {
    if (editingId) {
      // Tìm staff member hiện tại để lấy thông tin đầy đủ
      const currentMember = staffMembers.find(m => m.id === editingId);
      if (!currentMember) {
        window.alert('Không tìm thấy nhân viên để cập nhật');
        return;
      }

      try {
        const payload = {
          name: formValues.fullname,
          email: formValues.email,
          role: currentMember.role || 'staff',
          status: mapClientStatusToServer(formValues.status),
          phone: formValues.phone?.trim() || null,
          avatarUrl: currentMember.avatarUrl || null,
          birthday: currentMember.birthday || null,
          gender: currentMember.gender || null
        };

        const updatedUser = await userService.updateUser(editingId, payload);
        const normalizedMember = normalizeStaffMember(updatedUser);
        
        setStaffMembers((prev) =>
          prev.map((member) =>
            member.id === editingId ? normalizedMember : member
          )
        );
        setModalState({ open: false, payload: null });
      } catch (updateError) {
        window.alert(updateError.message || 'Không thể cập nhật nhân viên. Vui lòng thử lại.');
      }
    } else {
      // Tạo mới - chỉ cập nhật state local (có thể thêm API createUser sau)
      const nextId = Math.max(0, ...staffMembers.map((member) => member.id || 0)) + 1;
      setStaffMembers((prev) => [
        ...prev,
        {
          id: nextId,
          fullname: formValues.fullname,
          email: formValues.email,
          phone: formValues.phone || '—',
          status: formValues.status,
          joinedAt: new Date().toISOString()
        }
      ]);
      setModalState({ open: false, payload: null });
    }
  };

  return (
    <div className="container-fluid p-4 p-lg-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-5">
        <div>
          <h1 className="h3 mb-1">Quản lý nhân viên</h1>
          <p className="text-muted mb-0">Danh sách nhân viên hỗ trợ hệ thống.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={loadStaff}>
            <i className="bi bi-arrow-clockwise me-2" />Tải lại
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalState({ open: true, payload: null })}
          >
            <i className="bi bi-person-plus me-2" />Thêm nhân viên
          </button>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2" role="alert">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Đang tải danh sách nhân viên...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label">Tìm kiếm</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Tên hoặc email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Tất cả</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Họ tên</th>
                <th scope="col">Email</th>
                <th scope="col">Điện thoại</th>
                <th scope="col">Ngày tham gia</th>
                <th scope="col">Trạng thái</th>
                <th scope="col" className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">Chưa có nhân viên nào.</td>
                </tr>
              )}
              {filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td className="fw-semibold">{member.fullname}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>{formatDate(member.joinedAt)}</td>
                  <td>
                    <span className={`badge ${STATUS_VARIANTS[member.status] || 'bg-secondary'}`}>
                      {STATUS_LABELS[member.status] || member.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setModalState({ open: true, payload: member })}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(member)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer text-muted">
          Tổng cộng {filteredStaff.length} nhân viên
        </div>
      </div>

      {modalState.open && (
        <StaffModal
          show
          onClose={() => setModalState({ open: false, payload: null })}
          onSave={handleSave}
          member={modalState.payload}
        />
      )}
    </div>
  );
};

const StaffModal = ({ show, onClose, onSave, member }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const editingId = member?.id ?? null;
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (show) {
      if (member) {
        setForm({
          fullname: member.fullname,
          email: member.email,
          phone: member.phone === '—' ? '' : member.phone,
          status: member.status
        });
      } else {
        setForm(emptyForm);
      }
      setSubmitting(false);
    }
  }, [show, member]);

  if (!show || !modalRoot) return null;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSave(form, editingId);
    } catch (error) {
      setSubmitting(false);
    }
  };

  return createPortal(
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Họ tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.fullname}
                      onChange={handleChange('fullname')}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={handleChange('email')}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Điện thoại</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={form.phone}
                      onChange={handleChange('phone')}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={form.status} onChange={handleChange('status')}>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>Đóng</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
    </>,
    modalRoot
  );
};

export default StaffPage;
