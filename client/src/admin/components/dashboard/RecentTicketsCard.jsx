import React from 'react';

const RecentTicketsCard = ({ tickets = [] }) => (
  <div className="card h-100">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="card-title mb-0">Support Tickets</h5>
      <span className="badge bg-warning-subtle text-warning-emphasis">Recent Requests</span>
    </div>
    <div className="card-body p-0">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light small uppercase">
            <tr>
              <th className="px-4">Ticket ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-end px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4"><strong>{ticket.id}</strong></td>
                <td>{ticket.customer}</td>
                <td>
                  <span className={`badge ${ticket.status === 'OPEN' ? 'bg-info' : ticket.status === 'RESOLVED' ? 'bg-success' : 'bg-secondary'}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="text-end px-4 text-muted small">{ticket.date}</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-muted">No support tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default RecentTicketsCard;
