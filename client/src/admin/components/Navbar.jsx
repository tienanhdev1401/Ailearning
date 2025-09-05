import React from "react";
import avatar3 from "../img/avatars/avatar-3.jpg";
import avatarUser from "../img/avatars/avatar.jpg";

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand navbar-light navbar-bg">
      {/* Sidebar toggle */}
      <button className="sidebar-toggle js-sidebar-toggle btn btn-link">
        <i className="hamburger align-self-center"></i>
      </button>

      <div className="navbar-collapse collapse">
        <ul className="navbar-nav navbar-align">
          {/* 🔔 Notifications */}
          <li className="nav-item dropdown">
            <button
              className="nav-icon dropdown-toggle btn btn-link"
              data-bs-toggle="dropdown"
            >
              <div className="position-relative">
                <i className="align-middle" data-feather="bell"></i>
                <span className="indicator">4</span>
              </div>
            </button>
            <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end py-0">
              <div className="dropdown-menu-header">4 New Notifications</div>
              <div className="list-group">
                <button className="list-group-item btn btn-link text-start">
                  <div className="row g-0 align-items-center">
                    <div className="col-2">
                      <i
                        className="text-danger"
                        data-feather="alert-circle"
                      ></i>
                    </div>
                    <div className="col-10">
                      <div className="text-dark">Update completed</div>
                      <div className="text-muted small mt-1">
                        Restart server 12 to complete the update.
                      </div>
                      <div className="text-muted small mt-1">30m ago</div>
                    </div>
                  </div>
                </button>
              </div>
              <div className="dropdown-menu-footer">
                <button className="btn btn-link text-muted">
                  Show all notifications
                </button>
              </div>
            </div>
          </li>

          {/* ✉️ Messages */}
          <li className="nav-item dropdown">
            <button
              className="nav-icon dropdown-toggle btn btn-link"
              id="messagesDropdown"
              data-bs-toggle="dropdown"
            >
              <div className="position-relative">
                <i className="align-middle" data-feather="message-square"></i>
              </div>
            </button>
            <div
              className="dropdown-menu dropdown-menu-lg dropdown-menu-end py-0"
              aria-labelledby="messagesDropdown"
            >
              <div className="dropdown-menu-header">
                <div className="position-relative">4 New Messages</div>
              </div>

              <div className="list-group">
                <button className="list-group-item btn btn-link text-start">
                  <div className="row g-0 align-items-center">
                    <div className="col-2">
                      <img
                        src="img/avatars/avatar-5.jpg"
                        className="avatar img-fluid rounded-circle"
                        alt="Vanessa Tucker"
                      />
                    </div>
                    <div className="col-10 ps-2">
                      <div className="text-dark">Vanessa Tucker</div>
                      <div className="text-muted small mt-1">
                        Nam pretium turpis et arcu. Duis arcu tortor.
                      </div>
                      <div className="text-muted small mt-1">15m ago</div>
                    </div>
                  </div>
                </button>

                <button className="list-group-item btn btn-link text-start">
                  <div className="row g-0 align-items-center">
                    <div className="col-2">
                      <img
                        src="img/avatars/avatar-2.jpg"
                        className="avatar img-fluid rounded-circle"
                        alt="William Harris"
                      />
                    </div>
                    <div className="col-10 ps-2">
                      <div className="text-dark">William Harris</div>
                      <div className="text-muted small mt-1">
                        Curabitur ligula sapien euismod vitae.
                      </div>
                      <div className="text-muted small mt-1">2h ago</div>
                    </div>
                  </div>
                </button>

                <button className="list-group-item btn btn-link text-start">
                  <div className="row g-0 align-items-center">
                    <div className="col-2">
                      <img
                        src="img/avatars/avatar-4.jpg"
                        className="avatar img-fluid rounded-circle"
                        alt="Christina Mason"
                      />
                    </div>
                    <div className="col-10 ps-2">
                      <div className="text-dark">Christina Mason</div>
                      <div className="text-muted small mt-1">
                        Pellentesque auctor neque nec urna.
                      </div>
                      <div className="text-muted small mt-1">4h ago</div>
                    </div>
                  </div>
                </button>

                <button className="list-group-item btn btn-link text-start">
                  <div className="row g-0 align-items-center">
                    <div className="col-2">
                      <img
                        src={avatar3}
                        className="avatar img-fluid rounded-circle"
                        alt="Sharon Lessman"
                      />
                    </div>
                    <div className="col-10 ps-2">
                      <div className="text-dark">Sharon Lessman</div>
                      <div className="text-muted small mt-1">
                        Aenean tellus metus, bibendum sed, posuere ac, mattis
                        non.
                      </div>
                      <div className="text-muted small mt-1">5h ago</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="dropdown-menu-footer">
                <button className="btn btn-link text-muted">
                  Show all messages
                </button>
              </div>
            </div>
          </li>

          {/* 👤 User Profile */}
          <li className="nav-item dropdown">
            {/* Icon settings cho mobile */}
            <button
              className="nav-icon dropdown-toggle d-inline-block d-sm-none btn btn-link"
              data-bs-toggle="dropdown"
            >
              <i className="align-middle" data-feather="settings"></i>
            </button>

            {/* Avatar + tên cho desktop */}
            <button
              className="nav-link dropdown-toggle d-none d-sm-inline-block btn btn-link"
              data-bs-toggle="dropdown"
            >
              <img
                src={avatarUser}
                className="avatar img-fluid rounded me-1"
                alt="Charles Hall"
              />{" "}
              <span className="text-dark">Charles Hall</span>
            </button>

            <div className="dropdown-menu dropdown-menu-end">
              <a className="dropdown-item" href="pages-profile.html">
                <i className="align-middle me-1" data-feather="user"></i>{" "}
                Profile
              </a>
              <a className="dropdown-item" href="/">
                <i className="align-middle me-1" data-feather="pie-chart"></i>{" "}
                Analytics
              </a>
              <div className="dropdown-divider"></div>
              <a className="dropdown-item" href="index.html">
                <i className="align-middle me-1" data-feather="settings"></i>{" "}
                Settings & Privacy
              </a>
              <a className="dropdown-item" href="/">
                <i className="align-middle me-1" data-feather="help-circle"></i>{" "}
                Help Center
              </a>
              <div className="dropdown-divider"></div>
              <a className="dropdown-item" href="/">
                Log out
              </a>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
