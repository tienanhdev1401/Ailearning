import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import userService from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { INITIAL_USERS } from '../data/users';

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  user: 'Học viên',
  staff: 'Nhân viên',
  guest: 'Khách'
};

const STATUS_LABELS = {
  active: 'Hoạt động',
  inactive: 'Ngưng',
  banned: 'Bị cấm'
};

const STATUS_VARIANTS = {
  active: 'bg-success',
  inactive: 'bg-secondary',
  banned: 'bg-danger text-white'
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngưng' },
  { value: 'banned', label: 'Bị cấm' }
];

const GENDER_LABELS = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác'
};

const GENDER_OPTIONS = [
  { value: '', label: 'Chưa chọn' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' }
];

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'user',
  status: 'active',
  phone: '',
  avatarUrl: '',
  birthday: '',
  gender: '',
  password: '',
  authProvider: 'local'
};

const ensureUserRoleList = (list) => list.filter(user => (user.role || 'user') === 'user');

const mapServerStatus = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'INACTIVE':
      return 'inactive';
    case 'BANNED':
      return 'banned';
    default:
      return 'active';
  }
};

const mapClientStatusToServer = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'ACTIVE';
    case 'inactive':
      return 'INACTIVE';
    case 'banned':
      return 'BANNED';
    default:
      return 'ACTIVE';
  }
};

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
  } catch {
    return 'Chưa cập nhật';
  }
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return 'Chưa cập nhật';
  }
};

const normalizeServerUser = (user) => {
  const role = (user.role || 'user').toString().toLowerCase();
  const status = mapServerStatus(user.status);
  const birthdayRaw = user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : '';
  const avatarRaw = user.avatarUrl ?? '';
  const avatarDisplay = avatarRaw || '/assets/images/avatar-placeholder.svg';
  return {
    id: user.id,
    name: user.name || 'Chưa rõ tên',
    email: user.email || 'Chưa có email',
    role,
    status,
    lastActive: formatDateTime(user.updatedAt || user.startedAt || user.createdAt),
    joinedAt: user.startedAt || user.createdAt || new Date().toISOString(),
    avatarUrl: avatarRaw,
    avatarDisplay,
    phone: user.phone ?? '',
    birthday: birthdayRaw,
    gender: user.gender || '',
  };
};

const seededInitialUsers = ensureUserRoleList(
  INITIAL_USERS.map(user => normalizeServerUser({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    startedAt: user.joinDate,
    createdAt: user.joinDate,
    updatedAt: user.joinDate,
    avatarUrl: user.avatar,
    phone: user.phone,
    birthday: user.birthday ?? null,
    gender: user.gender ?? null,
  }))
);

const UsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState(seededInitialUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalState, setModalState] = useState({ type: null, payload: null });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      const normalized = Array.isArray(data) ? data.map(normalizeServerUser) : [];
      const filtered = ensureUserRoleList(normalized);
      setUsers(filtered);
      setError(null);
    } catch (fetchError) {
      setError(fetchError.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      if (cancelled) return;
      await loadUsers();
    };
    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return users.filter(user => {
      const matchesQuery =
        lowered.length === 0 ||
        user.name.toLowerCase().includes(lowered) ||
        user.email.toLowerCase().includes(lowered);
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const sortedUsers = useMemo(() => {
    const copy = [...filteredUsers];
    copy.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue, 'vi', { sensitivity: 'base' });
        return sortDirection === 'asc' ? result : -result;
      }
      if (aValue === bValue) return 0;
      if (sortDirection === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
    return copy;
  }, [filteredUsers, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, sortedUsers]);

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i += 1) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    return [...new Set(rangeWithDots)];
  }, [currentPage, totalPages]);

  const toggleSort = (field) => {
    setCurrentPage(1);
    setSortField(field);
    setSortDirection(prev => (sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
  };

  const toggleSelectAll = (checked) => {
    const pageIds = paginatedUsers.map(user => user.id);
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const toggleSelectOne = (userId) => {
    setSelectedIds(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]));
  };

  const handleBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.warning('Vui lòng chọn người dùng trước.');
      return;
    }
    if (action === 'delete') {
      const confirmed = await toast.confirm(`Xóa ${selectedIds.length} người dùng?`, { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
      if (!confirmed) return;
      setUsers(prev => prev.filter(user => !selectedIds.includes(user.id)));
      setSelectedIds([]);
    } else if (action === 'activate' || action === 'deactivate') {
      const status = action === 'activate' ? 'active' : 'inactive';
      const serverStatus = mapClientStatusToServer(status);
      
      try {
        // Cập nhật từng user qua API
        const updatePromises = selectedIds.map(async (userId) => {
          const user = users.find(u => u.id === userId);
          if (!user) return null;
          
          const payload = {
            name: user.name,
            email: user.email,
            role: user.role,
            status: serverStatus,
            phone: user.phone || null,
            avatarUrl: user.avatarUrl || null,
            birthday: user.birthday || null,
            gender: user.gender || null
          };
          
          const updatedUser = await userService.updateUser(userId, payload);
          return normalizeServerUser(updatedUser);
        });
        
        const updatedUsers = await Promise.all(updatePromises);
        
        // Cập nhật state với dữ liệu từ server
        setUsers(prev => ensureUserRoleList(prev.map(user => {
          const updated = updatedUsers.find(u => u && u.id === user.id);
          return updated || user;
        })));
        
        setSelectedIds([]);
      } catch (updateError) {
        toast.error(updateError.message || 'Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.');
      }
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const serverStatus = mapClientStatusToServer(newStatus);
    
    try {
      const payload = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: serverStatus,
        phone: user.phone || null,
        avatarUrl: user.avatarUrl || null,
        birthday: user.birthday || null,
        gender: user.gender || null
      };
      
      const updatedUser = await userService.updateUser(user.id, payload);
      const normalizedUser = normalizeServerUser(updatedUser);
      
      setUsers(prev => ensureUserRoleList(prev.map(u => (
        u.id === user.id ? normalizedUser : u
      ))));
    } catch (updateError) {
      toast.error(updateError.message || 'Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.');
    }
  };

  const handleOpenUserModal = (user = null) => {
    setModalState({ type: 'user', payload: user });
  };

  // const handleOpenImportModal = () => {
  //   setModalState({ type: 'import', payload: null });
  // };

  const handleCloseModal = () => {
    setModalState({ type: null, payload: null });
  };

  const handleSaveUser = async (form, editingId) => {
    if (editingId) {
      const payload = {
        name: `${form.firstName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
        email: form.email,
        role: form.role,
        status: mapClientStatusToServer(form.status),
        phone: form.phone?.trim() || null,
        avatarUrl: form.avatarUrl?.trim() || null,
        birthday: form.birthday || null,
        gender: form.gender || null
      };

      const phone = form.phone?.trim() || '';
      if (phone && (phone.length !== 10 || !/^\d+$/.test(phone))) {
        toast.error('Số điện thoại phải có đúng 10 chữ số');
        throw new Error('Validation failed');
      }

      try {
        const updatedUser = await userService.updateUser(editingId, payload);
        const normalizedUser = normalizeServerUser(updatedUser);
        setUsers(prev => ensureUserRoleList(prev.map(user => (
          user.id === editingId ? normalizedUser : user
        ))));
        setSelectedIds(prev => prev.filter(id => id !== editingId));
        handleCloseModal();
      } catch (updateError) {
        toast.error(updateError.message || 'Không thể cập nhật người dùng. Vui lòng thử lại.');
        throw updateError;
      }
      return;
    } else {
      // Create via API to match Staff behavior. Validate client-side before call.
      const errors = [];
      const pw = form.password;
      const auth = (form.authProvider || '').toString();

      if (typeof pw === 'undefined' || pw === null || String(pw).trim() === '') {
        errors.push('Mật khẩu không được để trống');
      } else if (typeof pw !== 'string') {
        errors.push('Mật khẩu phải là chuỗi ký tự');
      } else if (pw.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
      }

      if (!['local', 'google'].includes(auth)) {
        errors.push('AuthProvider chỉ có thể là: local, google');
      }

      const phone = form.phone?.trim() || '';
      if (phone && (phone.length !== 10 || !/^\d+$/.test(phone))) {
        errors.push('Số điện thoại phải có đúng 10 chữ số');
      }

      if (errors.length > 0) {
        toast.error(errors.join('. '));
        throw new Error('Validation failed');
      }

      try {
        const payload = {
          name: `${form.firstName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
          email: form.email,
          role: 'user',
          password: String(form.password),
          authProvider: form.authProvider || 'local'
        };

        const created = await userService.createUser(payload);
        const normalized = normalizeServerUser(created);
        setUsers(prev => ensureUserRoleList([ ...prev, normalized ]));
        handleCloseModal();
        return;
      } catch (createError) {
        toast.error(createError.message || 'Không thể tạo người dùng. Vui lòng thử lại.');
        throw createError;
      }
    }
  };

  // const handleExport = () => {
  //   const headers = ['ID', 'Name', 'Email', 'Role', 'Status','Phone', 'Join Date', 'Last Active'];
  //   const rows = sortedUsers.map(user => [
  //     user.id,
  //     user.name,
  //     user.email,
  //     user.role,
  //     user.status,
  //     user.phone,
  //     formatDate(user.joinedAt),
  //     user.lastActive
  //   ]);
  //   const csvContent = [headers, ...rows]
  //     .map(row => row.map(value => `"${value ?? ''}"`).join(','))
  //     .join('\n');
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = 'users-export.csv';
  //   link.click();
  //   URL.revokeObjectURL(url);
  // };

  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every(user => selectedIds.includes(user.id));

  return (
    <div className="container-fluid p-4 p-lg-5">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-5">
        <div>
          <h1 className="h3 mb-1">Quản lý người dùng</h1>
          <p className="text-muted mb-0">Theo dõi vai trò, trạng thái và hoạt động người dùng.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {/* <button type="button" className="btn btn-outline-secondary" onClick={handleOpenImportModal}>
            <i className="bi bi-upload me-2" />Import Users
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={handleExport}>
            <i className="bi bi-download me-2" />Export
          </button> */}
          <button type="button" className="btn btn-outline-secondary" onClick={loadUsers}>
            <i className="bi bi-arrow-clockwise me-1" />Tải lại
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleOpenUserModal()}>
            <i className="bi bi-person-plus me-2" />Thêm người dùng
          </button>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info d-flex align-items-center gap-2" role="alert">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Đang tải dữ liệu thật từ server...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          Không thể tải dữ liệu từ server: {error}. Dữ liệu đang hiển thị có thể chưa được cập nhật mới nhất.
        </div>
      )}

      {/* <div className="row g-4 mb-5">
        <StatsCard
          title="Tổng người dùng"
          value={stats.total}
          subtitle="Biến động theo tháng"
          iconClass="bi-people-fill"
          variant="primary"
        />
        <StatsCard
          title="Đang hoạt động"
          value={stats.active}
          subtitle="Tăng trưởng tuần này"
          iconClass="bi-person-check-fill"
          variant="success"
        />
        <StatsCard
          title="Mới trong tháng"
          value={stats.newThisMonth}
          subtitle="So với tháng trước"
          iconClass="bi-person-plus-fill"
          variant="info"
        />
        <div className="col-xl-3 col-lg-6">
          <div className="card h-100">
            <div className="card-body p-3 p-lg-4 d-flex align-items-center">
              <div style={{ width: 80 }}>
                <Chart options={sparklineOptions} series={[{ name: 'Active', data: ACTIVE_RATE_SERIES }]} type="line" height={60} />
              </div>
              <div className="ms-3">
                <h6 className="mb-0 text-muted">Tỉ lệ hoạt động</h6>
                <h3 className="mb-0">{stats.activePercentage}%</h3>
                <small className="text-muted"><i className="bi bi-clock me-1" />24h gần nhất</small>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-xl-4 col-lg-6">
              <label className="form-label">Tìm kiếm</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search" /></span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Tên hoặc email"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="col-lg-3 col-md-4">
              <label className="form-label">Trạng thái</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {/* <div className="col-lg-3 col-md-4">
              <label className="form-label">Vai trò</label>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div> */}
          </div>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleBulkAction('activate')}>
              <i className="bi bi-check-circle me-1" />Kích hoạt
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleBulkAction('deactivate')}>
              <i className="bi bi-pause-circle me-1" />Tạm ngưng
            </button>
            {/* <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleBulkAction('delete')}>
              <i className="bi bi-trash me-1" />Xóa đã chọn
            </button> */}
            {selectedIds.length > 0 && (
              <span className="badge bg-primary align-self-center">{selectedIds.length} người dùng đã chọn</span>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col" style={{ width: 48 }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(event) => toggleSelectAll(event.target.checked)}
                  />
                </th>
                <SortableHeader label="Tên" field="name" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Email" field="email" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                <th scope="col">Vai trò</th>
                <SortableHeader label="Trạng thái" field="status" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                <th scope="col">Điện thoại</th>
                <th scope="col">Giới tính</th>
                <th scope="col">Ngày sinh</th>
                <SortableHeader label="Hoạt động" field="lastActive" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
                <th scope="col" className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-5 text-muted">Không có dữ liệu phù hợp.</td>
                </tr>
              )}
              {paginatedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelectOne(user.id)}
                    />
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <img src={user.avatarDisplay} alt={user.name} width="36" height="36" className="rounded-circle me-3" />
                      <div>
                        <span className="fw-semibold d-block">{user.name}</span>
                        <small className="text-muted">Tham gia ngày {formatDate(user.joinedAt)}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle">{ROLE_LABELS[user.role] || user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_VARIANTS[user.status] || 'bg-secondary'}`}>
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                  </td>
                  <td>{user.phone || '—'}</td>
                  <td>{user.gender ? GENDER_LABELS[user.gender] || user.gender : '—'}</td>
                  <td>{user.birthday ? formatDate(user.birthday) : '—'}</td>
                  <td>{user.lastActive}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => handleOpenUserModal(user)}>
                        <i className="bi bi-pencil" />
                      </button>
                      {user.status === 'active' ? (
                        <button type="button" className="btn btn-outline-warning" onClick={() => handleToggleUserStatus(user)} title="Tạm ngưng">
                          <i className="bi bi-pause-circle" />
                        </button>
                      ) : (
                        <button type="button" className="btn btn-outline-success" onClick={() => handleToggleUserStatus(user)} title="Kích hoạt">
                          <i className="bi bi-check-circle" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <small className="text-muted">Hiển thị {paginatedUsers.length} / {sortedUsers.length} người dùng</small>
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                &laquo;
              </button>
            </li>
            {paginationRange.map((page, index) => (
              <li key={`${page}-${index}`} className={`page-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}>
                {page === '...' ? (
                  <span className="page-link">&hellip;</span>
                ) : (
                  <button className="page-link" type="button" onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                )}
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" type="button" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                &raquo;
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* <div className="row g-4 mb-5">
        <div className="col-xl-8">
          <SectionCard title="Tăng trưởng người dùng">
            <Chart options={userGrowthOptions} series={[{ name: 'Người dùng mới', data: USER_GROWTH_SERIES }]} type="bar" height={260} />
          </SectionCard>
        </div>
        <div className="col-xl-4">
          <SectionCard title="Phân bổ vai trò">
            <div className="text-center">
              <Chart options={roleDistributionOptions} series={roleDistribution.series} type="donut" height={220} />
              <div className="mt-3">
                {roleDistribution.labels.map((label, index) => (
                  <div key={label} className="d-flex justify-content-between small text-muted">
                    <span>{label}</span>
                    <span>{users.length ? roleDistribution.series[index] : 0} người</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div> */}

      {/* <div className="row g-4">
        <div className="col-xl-4">
          <SectionCard title="Hoạt động gần đây">
            <ul className="list-group list-group-flush">
              {RECENT_USER_ACTIVITIES.map(activity => (
                <li key={activity.id} className="list-group-item px-0">
                  <div className="d-flex gap-3">
                    <span className="badge bg-primary-subtle text-primary-emphasis rounded-circle p-3"><i className={`bi ${activity.icon}`} /></span>
                    <div>
                      <strong>{activity.user}</strong>
                      <p className="mb-1">{activity.action}</p>
                      <small className="text-muted">{activity.time} &middot; {activity.details}</small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div> */}

      {modalState.type === 'user' && (
        <UserModal show onClose={handleCloseModal} onSave={handleSaveUser} user={modalState.payload} />
      )}

      {modalState.type === 'import' && (
        <ImportUsersModal show onClose={handleCloseModal} />
      )}
    </div>
  );
};

const SortableHeader = ({ label, field, sortField, sortDirection, onSort }) => (
  <th scope="col" role="button" onClick={() => onSort(field)}>
    <span className="d-inline-flex align-items-center">
      {label}
      {sortField === field && (
        <i className={`bi ms-1 ${sortDirection === 'asc' ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />
      )}
    </span>
  </th>
);

const modalRoot = typeof document !== 'undefined' ? document.body : null;

const UserModal = ({ show, onClose, onSave, user }) => {
  const [form, setForm] = useState(emptyForm);
  const editingId = user?.id ?? null;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      if (user) {
        const [firstName, ...rest] = user.name.split(' ');
        setForm({
          firstName,
          lastName: rest.join(' '),
          email: user.email,
          role: 'user',
          status: user.status,
          phone: user.phone || '',
          avatarUrl: user.avatarUrl || '',
          birthday: user.birthday || '',
          gender: user.gender || '',
          password: '',
          authProvider: user.authProvider || 'local'
        });
      } else {
        setForm(emptyForm);
      }
      setSubmitting(false);
    }
  }, [show, user]);

  if (!show || !modalRoot) return null;

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
              <h5 className="modal-title">{editingId ? 'Cập nhật người dùng' : 'Thêm người dùng'}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ</label>
                    <input type="text" className="form-control" value={form.firstName} onChange={(event) => setForm(prev => ({ ...prev, firstName: event.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tên</label>
                    <input type="text" className="form-control" value={form.lastName} onChange={(event) => setForm(prev => ({ ...prev, lastName: event.target.value }))} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={(event) => setForm(prev => ({ ...prev, email: event.target.value }))} required />
                  </div>
                  {/* Role is fixed to 'user' (Học viên) — do not allow selecting other roles */}
                  <input type="hidden" value="user" />
                  <div className="col-12">
                    <label className="form-label">Mật khẩu</label>
                    <input type="password" className="form-control" value={form.password} onChange={(event) => setForm(prev => ({ ...prev, password: event.target.value }))} placeholder={editingId ? 'Để trống nếu không đổi mật khẩu' : ''} required={!editingId} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Auth Provider</label>
                    <select className="form-select" value={form.authProvider} onChange={(event) => setForm(prev => ({ ...prev, authProvider: event.target.value }))}>
                      <option value="local">local</option>
                      <option value="google">google</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={form.status} onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value }))}>
                      {STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Điện thoại</label>
                    <input type="tel" className="form-control" value={form.phone} onChange={(event) => setForm(prev => ({ ...prev, phone: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Giới tính</label>
                    <select className="form-select" value={form.gender} onChange={(event) => setForm(prev => ({ ...prev, gender: event.target.value }))}>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày sinh</label>
                    <input type="date" className="form-control" value={form.birthday} onChange={(event) => setForm(prev => ({ ...prev, birthday: event.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ảnh đại diện (URL)</label>
                    <input type="url" className="form-control" value={form.avatarUrl} onChange={(event) => setForm(prev => ({ ...prev, avatarUrl: event.target.value }))} placeholder="https://" />
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

const ImportUsersModal = ({ show, onClose }) => {
  const toast = useToast();
  const [fileName, setFileName] = useState('');

  if (!show || !modalRoot) return null;

  return createPortal(
    <>
      <div className="modal fade show" style={{ display: 'block', zIndex: 1060 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Import Users</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="text-muted">Upload file CSV để tạo hoặc cập nhật người dùng hàng loạt.</p>
              <label className="form-label">Chọn file CSV</label>
              <input
                type="file"
                accept=".csv"
                className="form-control"
                onChange={(event) => setFileName(event.target.files?.[0]?.name || '')}
              />
              {fileName && <small className="text-success d-block mt-2">Đã chọn: {fileName}</small>}
              <div className="alert alert-light border mt-3" role="alert">
                <strong>Mẹo:</strong> tải file mẫu ở dashboard gốc để đúng định dạng.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={() => { toast.success('Import thành công (mô phỏng)'); onClose(); }}>
                Tải lên
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
    </>,
    modalRoot
  );
};

export default UsersPage;
