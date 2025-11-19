const ActivityFeedCard = ({ items }) => (
  <div className="card h-100">
    <div className="card-header">
      <h5 className="card-title mb-0">Recent Activity</h5>
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
