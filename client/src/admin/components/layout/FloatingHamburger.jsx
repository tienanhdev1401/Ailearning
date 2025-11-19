const FloatingHamburger = ({ collapsed, onToggle }) => (
  <button
    type="button"
    className={`hamburger-menu ${collapsed ? 'is-active' : ''}`}
    aria-label="Toggle sidebar"
    onClick={onToggle}
  >
    <i className="bi bi-list" />
  </button>
);

export default FloatingHamburger;
