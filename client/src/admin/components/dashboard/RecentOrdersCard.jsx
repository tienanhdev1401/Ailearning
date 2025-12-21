const RecentOrdersCard = ({ orders }) => (
  <div className="card h-100">
    <div className="card-header">
      <h5 className="card-title mb-0">Tickets</h5>
    </div>
    <div className="card-body">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
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

export default RecentOrdersCard;
