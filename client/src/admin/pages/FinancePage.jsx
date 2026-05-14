import React, { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';

const Avatar = ({ user, size = '40px', className = '' }) => {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  const char = user?.name?.charAt(0) || 'U';
  const bgColor = colors[char.charCodeAt(0) % colors.length];

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`rounded-circle object-fit-cover ${className}`}
        style={{ width: size, height: size, border: '2px solid var(--bs-border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      />
    );
  }

  return (
    <div
      className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold ${className}`}
      style={{ width: size, height: size, backgroundColor: bgColor, fontSize: '14px', border: '2px solid var(--bs-border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
    >
      {char}
    </div>
  );
};

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tx, sub, top] = await Promise.all([
        dashboardService.getTransactions(),
        dashboardService.getSubscriptions(),
        dashboardService.getTopCustomers()
      ]);
      setTransactions(Array.isArray(tx) ? tx : []);
      setSubscriptions(Array.isArray(sub) ? sub : []);
      setTopCustomers(Array.isArray(top) ? top : []);
    } catch (err) {
      console.error('Initial load failed', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshActiveTab = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const data = await dashboardService.getTransactions();
        setTransactions(Array.isArray(data) ? data : []);
      } else if (activeTab === 'subscriptions') {
        const data = await dashboardService.getSubscriptions();
        setSubscriptions(Array.isArray(data) ? data : []);
      } else {
        const data = await dashboardService.getTopCustomers();
        setTopCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t =>
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.package?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const activeSubsCount = subscriptions.filter(s => s.isActive).length;

  return (
    <div className="container-fluid p-4 p-lg-5 min-vh-100">
      <div className="admin-page-header">
        <div className="header-info">
          <h1 className="mb-0">Finance Hub</h1>
          <p>Monitor your business health and customer lifecycle.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline-primary" onClick={loadAllData}>
            <i className="bi bi-arrow-clockwise me-2" />Sync Data
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4 bg-gradient-primary text-white" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-white bg-opacity-25 p-2 rounded-3">
                  <i className="bi bi-wallet2 fs-4" />
                </div>
                <span className="badge bg-white bg-opacity-25 rounded-pill">Total Revenue</span>
              </div>
              <h2 className="mb-0 fw-bold">{totalRevenue.toLocaleString()} VNĐ</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-success-subtle p-2 rounded-3">
                  <i className="bi bi-person-check fs-4 text-success" />
                </div>
                <span className="badge bg-success-subtle text-success rounded-pill">Active Subscriptions</span>
              </div>
              <h2 className="mb-0 fw-bold text-body">{activeSubsCount}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-warning-subtle p-2 rounded-3">
                  <i className="bi bi-star-fill fs-4 text-warning" />
                </div>
                <span className="badge bg-warning-subtle text-warning rounded-pill">Top Spender</span>
              </div>
              <h2 className="mb-0 fw-bold text-body">{topCustomers[0]?.name || '...'}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="card-header bg-transparent border-bottom-0 pt-4 px-4">
          {error && (
            <div className="alert alert-danger mb-4" role="alert">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          )}
          <ul className="nav nav-pills gap-2 bg-body-tertiary p-1 rounded-3 d-inline-flex">
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 ${activeTab === 'transactions' ? 'bg-body shadow-sm text-primary active' : 'text-muted'}`}
                onClick={() => setActiveTab('transactions')}
              >
                <i className="bi bi-receipt me-2" />
                Transactions
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 ${activeTab === 'subscriptions' ? 'bg-body shadow-sm text-primary active' : 'text-muted'}`}
                onClick={() => setActiveTab('subscriptions')}
              >
                <i className="bi bi-shield-check me-2" />
                Subscriptions
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-4 py-2 ${activeTab === 'top-customers' ? 'bg-body shadow-sm text-primary active' : 'text-muted'}`}
                onClick={() => setActiveTab('top-customers')}
              >
                <i className="bi bi-trophy me-2" />
                Top Ranking
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body p-4">
          {activeTab !== 'top-customers' && (
            <div className="mb-4 d-flex justify-content-between align-items-center">
              <div className="input-group" style={{ maxWidth: '350px' }}>
                <span className="input-group-text bg-body-tertiary border-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control bg-body-tertiary border-0 shadow-none text-body"
                  placeholder="Search user or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-grow text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              {activeTab === 'transactions' ? (
                <table className="table table-hover align-middle">
                  <thead className="bg-body-tertiary text-muted small text-uppercase">
                    <tr>
                      <th className="py-3 border-0">TX ID</th>
                      <th className="py-3 border-0">Customer</th>
                      <th className="py-3 border-0">Package</th>
                      <th className="py-3 border-0">Amount</th>
                      <th className="py-3 border-0">Status</th>
                      <th className="py-3 border-0 text-end">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td><code className="bg-body-tertiary px-2 py-1 rounded text-primary">{tx.id.slice(0, 8)}</code></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Avatar user={tx.user} className="me-3" />
                            <div>
                              <div className="fw-bold text-body">{tx.user?.name || 'Unknown'}</div>
                              <div className="small text-muted">{tx.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-body">{tx.package?.name}</td>
                        <td><span className="fw-bold text-body">{Number(tx.amount).toLocaleString()} VNĐ</span></td>
                        <td>
                          <span className={`badge ${tx.status === 'SUCCESS' ? 'bg-success' :
                            tx.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'
                            } bg-opacity-10 text-opacity-100 px-3 py-2`} style={{ color: tx.status === 'SUCCESS' ? 'var(--bs-success)' : tx.status === 'PENDING' ? 'var(--bs-warning)' : 'var(--bs-danger)' }}>
                            <i className="bi bi-circle-fill me-2 small" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="text-end text-muted small">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'subscriptions' ? (
                <table className="table table-hover align-middle">
                  <thead className="bg-body-tertiary text-muted small text-uppercase">
                    <tr>
                      <th className="py-3 border-0">User</th>
                      <th className="py-3 border-0">Active Plan</th>
                      <th className="py-3 border-0">State</th>
                      <th className="py-3 border-0">Cycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscriptions.map(sub => (
                      <tr key={sub.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <Avatar user={sub.user} className="me-3" />
                            <div className="fw-bold text-body">{sub.user?.name || 'Unknown'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold text-primary">{sub.package?.name}</div>
                        </td>
                        <td>
                          <span className={`badge ${sub.isActive ? 'bg-success text-white' : 'bg-secondary text-white'} px-3`}>
                            {sub.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {new Date(sub.startDate).toLocaleDateString('vi-VN')} → {sub.endDate ? new Date(sub.endDate).toLocaleDateString('vi-VN') : 'Infinity'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="row g-4">
                  {topCustomers.map((cust, index) => (
                    <div className="col-md-6 col-lg-4" key={cust.id}>
                      <div className="card border-0 bg-body-tertiary h-100 hover-shadow transition-all" style={{ borderRadius: '12px' }}>
                        <div className="card-body p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <Avatar user={cust} size="60px" />
                            <div className={`fs-3 fw-bold ${index === 0 ? 'text-warning' : index === 1 ? 'text-secondary' : index === 2 ? 'text-bronze' : 'text-muted'}`}>
                              #{index + 1}
                            </div>
                          </div>
                          <h5 className="mb-1 fw-bold text-body">{cust.name}</h5>
                          <p className="text-muted small mb-3">{cust.email}</p>
                          <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25">
                            <span className="text-muted small">Total Investment</span>
                            <span className="fs-5 fw-bold text-success">{Number(cust.totalSpent).toLocaleString()} VNĐ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-gradient-primary { background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); }
        .text-bronze { color: #cd7f32; }
        .hover-shadow:hover { transform: translateY(-5px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important; }
        .transition-all { transition: all 0.3s ease; }
        .nav-pills .nav-link.active { color: #6366f1 !important; }
        [data-bs-theme="dark"] .card { background-color: #1e293b !important; }
        [data-bs-theme="dark"] .bg-body-tertiary { background-color: #0f172a !important; }
      `}} />
    </div>
  );
};

export default FinancePage;
