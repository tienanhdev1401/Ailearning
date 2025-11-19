const formatValue = (value, prefix = '', suffix = '') => {
  if (typeof value === 'number') {
    const formatted = value >= 1000 ? value.toLocaleString() : value;
    return `${prefix}${formatted}${suffix}`;
  }
  return `${prefix}${value}${suffix}`;
};

const StatsGrid = ({ stats }) => (
  <div className="row g-4 mb-4">
    {stats.map((card) => (
      <div className="col-xl-3 col-lg-6" key={card.label}>
        <div className="card stats-card h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className={`stats-icon ${card.bgClass} bg-opacity-10 ${card.iconVariant}`}>
                  <i className={`bi ${card.icon}`} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="mb-0 text-muted">{card.label}</h6>
                <h3 className="mb-0" data-stat-value>
                  {formatValue(card.value, card.prefix ?? '', card.suffix ?? '')}
                </h3>
                <small className={card.deltaVariant}>
                  <i className={`bi ${card.deltaVariant === 'text-success' ? 'bi-arrow-up' : 'bi-arrow-down'}`} />{' '}
                  {card.delta}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default StatsGrid;
