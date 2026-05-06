const ContentStatsCard = ({ stats = { roadmaps: 0, lessons: 0, activities: 0, minigames: 0 } }) => {
  const items = [
    { label: 'Roadmaps', value: stats?.roadmaps || 0, icon: 'bi-map', color: 'text-primary', bg: 'bg-primary' },
    { label: 'Lessons', value: stats?.lessons || 0, icon: 'bi-journal-text', color: 'text-success', bg: 'bg-success' },
    { label: 'Activities', value: stats?.activities || 0, icon: 'bi-puzzle', color: 'text-warning', bg: 'bg-warning' },
    { label: 'Minigames', value: stats?.minigames || 0, icon: 'bi-controller', color: 'text-info', bg: 'bg-info' },
  ];

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">System Content</h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {items.map((item) => (
            <div className="col-6" key={item.label}>
              <div className="p-3 rounded border">
                <div className={`d-inline-flex p-2 rounded-circle ${item.bg} bg-opacity-10 ${item.color} mb-2`}>
                  <i className={`bi ${item.icon}`} />
                </div>
                <h6 className="text-muted small mb-1">{item.label}</h6>
                <h4 className="mb-0">{item.value.toLocaleString()}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentStatsCard;
