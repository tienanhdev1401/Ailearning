import React from 'react';

const MonthlyRevenueReport = ({ data = [] }) => {
  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Monthly Revenue Report</h5>
        <span className="badge bg-primary-subtle text-primary-emphasis">Last 6 Months</span>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small uppercase">
              <tr>
                <th className="px-4">Month</th>
                <th>Revenue</th>
                <th>Transactions</th>
                <th className="text-end px-4">Growth</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.month}>
                  <td className="px-4 fw-medium">{item.month}</td>
                  <td>{item.revenue.toLocaleString()} VNĐ</td>
                  <td>{item.transactions} giao dịch</td>
                  <td className="text-end px-4">
                    <span className={`badge ${item.growth.startsWith('+') ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      <i className={`bi ${item.growth.startsWith('+') ? 'bi-graph-up' : 'bi-graph-down'} me-1`} />
                      {item.growth}
                    </span>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">No revenue data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueReport;
