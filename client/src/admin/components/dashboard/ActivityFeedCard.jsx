import { Link } from 'react-router-dom';

const ActivityFeedCard = ({ items }) => (
  <div className="card h-100">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h5 className="card-title mb-0">Recent Activity</h5>
      <Link to="/admin/reports" className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-semibold">
        View All <i className="bi bi-arrow-right-short fs-5 align-middle"></i>
      </Link>
    </div>
    <div className="card-body">
      <div className="activity-feed">
        {items.map((item) => (
          <div className="activity-item" key={item.title}>
            <div className={`activity-icon ${item.bgClass} bg-opacity-10 ${item.iconVariant}`}>
              <i className={`bi ${item.icon}`} />
            </div>
            <div className="activity-content">
              <p className="mb-1">{item.title}</p>
              <small className="text-muted">{item.time}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ActivityFeedCard;
