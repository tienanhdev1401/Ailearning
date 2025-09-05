import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

const Sidebar = () => {
  return (
    <nav id="sidebar" className="sidebar js-sidebar">
      {/* SimpleBar để tạo thanh cuộn trong sidebar */}
      <SimpleBar className="sidebar-content">
        <a className="sidebar-brand d-flex justify-content-center align-items-center" href="/">
          <span className="align-middle fs-2 fw-bold">AelanG</span>
        </a>

        <ul className="sidebar-nav">
          <li className="sidebar-header">Pages</li>

          <li className="sidebar-item active">
            <a className="sidebar-link" href="/">
              <i className="align-middle" data-feather="sliders"></i>{" "}
              <span className="align-middle">Dashboard</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/profile">
              <i className="align-middle" data-feather="user"></i>{" "}
              <span className="align-middle">Profile</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/sign-in">
              <i className="align-middle" data-feather="log-in"></i>{" "}
              <span className="align-middle">Sign In</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/sign-up">
              <i className="align-middle" data-feather="user-plus"></i>{" "}
              <span className="align-middle">Sign Up</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/blank">
              <i className="align-middle" data-feather="book"></i>{" "}
              <span className="align-middle">Blank</span>
            </a>
          </li>

          <li className="sidebar-header">Tools & Components</li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/buttons">
              <i className="align-middle" data-feather="square"></i>{" "}
              <span className="align-middle">Buttons</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/forms">
              <i className="align-middle" data-feather="check-square"></i>{" "}
              <span className="align-middle">Forms</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/cards">
              <i className="align-middle" data-feather="grid"></i>{" "}
              <span className="align-middle">Cards</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/typography">
              <i className="align-middle" data-feather="align-left"></i>{" "}
              <span className="align-middle">Typography</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/icons">
              <i className="align-middle" data-feather="coffee"></i>{" "}
              <span className="align-middle">Icons</span>
            </a>
          </li>

          <li className="sidebar-header">Plugins & Addons</li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/charts">
              <i className="align-middle" data-feather="bar-chart-2"></i>{" "}
              <span className="align-middle">Charts</span>
            </a>
          </li>

          <li className="sidebar-item">
            <a className="sidebar-link" href="/maps">
              <i className="align-middle" data-feather="map"></i>{" "}
              <span className="align-middle">Maps</span>
            </a>
          </li>
        </ul>

        <div className="sidebar-cta">
          <div className="sidebar-cta-content">
            <strong className="d-inline-block mb-2">Upgrade to Pro</strong>
            <div className="mb-3 text-sm">
              Are you looking for more components? Check out our premium
              version.
            </div>
            <div className="d-grid">
              <a href="/upgrade" className="btn btn-primary">
                Upgrade to Pro
              </a>
            </div>
          </div>
        </div>
      </SimpleBar>
    </nav>
  );
};

export default Sidebar;
