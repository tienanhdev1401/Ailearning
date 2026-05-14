import { Link } from 'react-router-dom';

const RecentTransactionsCard = ({ orders }) => (
  <div className="card h-100">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="card-title mb-0">Recent Transactions</h5>
      <Link to="/admin/finance" className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-semibold">
        View All <i className="bi bi-arrow-right-short fs-5 align-middle"></i>
      </Link>
    </div>
    <div className="card-body">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead className="bg-body-tertiary small uppercase">
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><strong>{order.id}</strong></td>
                <td>{order.customer}</td>
                <td>{order.amount}</td>
                <td>
                  <span className={`badge ${order.status.className}`}>
                    {order.status.text}
                  </span>
                </td>
                <td>{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default RecentTransactionsCard;
