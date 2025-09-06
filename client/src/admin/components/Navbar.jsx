import React from "react";
import avatar3 from "../img/avatars/avatar-3.jpg";
import avatarUser from "../img/avatars/avatar.jpg";
import styles from "../AdminPage.module.css";

const Navbar = () => {
  return (
    <nav
      className={`${styles["navbar"]} ${styles["navbar-expand"]} ${styles["navbar-light"]} ${styles["navbar-bg"]}`}
    >
      {/* Sidebar toggle */}
      <button
        className={`${styles["sidebar-toggle"]} ${styles["js-sidebar-toggle"]} ${styles["btn"]} ${styles["btn-link"]}`}
      >
        <i className="hamburger align-self-center"></i>
      </button>

      <div className={`${styles["navbar-collapse"]} ${styles["collapse"]}`}>
        <ul className={`${styles["navbar-nav"]} ${styles["navbar-align"]}`}>
          {/* 🔔 Notifications */}
          <li className={`${styles["nav-item"]} ${styles["dropdown"]}`}>
            <button
              className={`${styles["nav-icon"]} ${styles["dropdown-toggle"]} ${styles["btn"]} ${styles["btn-link"]}`}
              data-bs-toggle="dropdown"
            >
              <div className={styles["position-relative"]}>
                <i className="align-middle" data-feather="bell"></i>
                <span className={styles["indicator"]}>4</span>
              </div>
            </button>
            <div
              className={`${styles["dropdown-menu"]} ${styles["dropdown-menu-lg"]} ${styles["dropdown-menu-end"]} ${styles["py-0"]}`}
            >
              <div className={styles["dropdown-menu-header"]}>
                4 New Notifications
              </div>
              <div className={styles["list-group"]}>
                <button
                  className={`${styles["list-group-item"]} ${styles["btn"]} ${styles["btn-link"]} ${styles["text-start"]}`}
                >
                  <div className={`${styles["row"]} ${styles["g-0"]} ${styles["align-items-center"]}`}>
                    <div className={styles["col-2"]}>
                      <i
                        className={styles["text-danger"]}
                        data-feather="alert-circle"
                      ></i>
                    </div>
                    <div className={styles["col-10"]}>
                      <div className={styles["text-dark"]}>Update completed</div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        Restart server 12 to complete the update.
                      </div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        30m ago
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <div className={styles["dropdown-menu-footer"]}>
                <button className={`${styles["btn"]} ${styles["btn-link"]} ${styles["text-muted"]}`}>
                  Show all notifications
                </button>
              </div>
            </div>
          </li>

          {/* ✉️ Messages */}
          <li className={`${styles["nav-item"]} ${styles["dropdown"]}`}>
            <button
              className={`${styles["nav-icon"]} ${styles["dropdown-toggle"]} ${styles["btn"]} ${styles["btn-link"]}`}
              id="messagesDropdown"
              data-bs-toggle="dropdown"
            >
              <div className={styles["position-relative"]}>
                <i className="align-middle" data-feather="message-square"></i>
              </div>
            </button>
            <div
              className={`${styles["dropdown-menu"]} ${styles["dropdown-menu-lg"]} ${styles["dropdown-menu-end"]} ${styles["py-0"]}`}
              aria-labelledby="messagesDropdown"
            >
              <div className={styles["dropdown-menu-header"]}>
                <div className={styles["position-relative"]}>4 New Messages</div>
              </div>

              <div className={styles["list-group"]}>
                <button
                  className={`${styles["list-group-item"]} ${styles["btn"]} ${styles["btn-link"]} ${styles["text-start"]}`}
                >
                  <div className={`${styles["row"]} ${styles["g-0"]} ${styles["align-items-center"]}`}>
                    <div className={styles["col-2"]}>
                      <img
                        src="img/avatars/avatar-5.jpg"
                        className={`${styles["avatar"]} ${styles["img-fluid"]} ${styles["rounded-circle"]}`}
                        alt="Vanessa Tucker"
                      />
                    </div>
                    <div className={`${styles["col-10"]} ${styles["ps-2"]}`}>
                      <div className={styles["text-dark"]}>Vanessa Tucker</div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        Nam pretium turpis et arcu. Duis arcu tortor.
                      </div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        15m ago
                      </div>
                    </div>
                  </div>
                </button>

                {/* Các message khác làm tương tự như trên */}
                <button
                  className={`${styles["list-group-item"]} ${styles["btn"]} ${styles["btn-link"]} ${styles["text-start"]}`}
                >
                  <div className={`${styles["row"]} ${styles["g-0"]} ${styles["align-items-center"]}`}>
                    <div className={styles["col-2"]}>
                      <img
                        src={avatar3}
                        className={`${styles["avatar"]} ${styles["img-fluid"]} ${styles["rounded-circle"]}`}
                        alt="Sharon Lessman"
                      />
                    </div>
                    <div className={`${styles["col-10"]} ${styles["ps-2"]}`}>
                      <div className={styles["text-dark"]}>Sharon Lessman</div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        Aenean tellus metus, bibendum sed, posuere ac, mattis non.
                      </div>
                      <div className={`${styles["text-muted"]} ${styles["small"]} ${styles["mt-1"]}`}>
                        5h ago
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className={styles["dropdown-menu-footer"]}>
                <button className={`${styles["btn"]} ${styles["btn-link"]} ${styles["text-muted"]}`}>
                  Show all messages
                </button>
              </div>
            </div>
          </li>

          {/* 👤 User Profile */}
          <li className={`${styles["nav-item"]} ${styles["dropdown"]}`}>
            {/* Icon settings cho mobile */}
            <button
              className={`${styles["nav-icon"]} ${styles["dropdown-toggle"]} ${styles["d-inline-block"]} ${styles["d-sm-none"]} ${styles["btn"]} ${styles["btn-link"]}`}
              data-bs-toggle="dropdown"
            >
              <i className="align-middle" data-feather="settings"></i>
            </button>

            {/* Avatar + tên cho desktop */}
            <button
              className={`${styles["nav-link"]} ${styles["dropdown-toggle"]} ${styles["d-none"]} ${styles["d-sm-inline-block"]} ${styles["btn"]} ${styles["btn-link"]}`}
              data-bs-toggle="dropdown"
            >
              <img
                src={avatarUser}
                className={`${styles["avatar"]} ${styles["img-fluid"]} ${styles["rounded"]} ${styles["me-1"]}`}
                alt="Charles Hall"
              />{" "}
              <span className={styles["text-dark"]}>Charles Hall</span>
            </button>

            <div className={`${styles["dropdown-menu"]} ${styles["dropdown-menu-end"]}`}>
              <a className={styles["dropdown-item"]} href="pages-profile.html">
                <i className="align-middle me-1" data-feather="user"></i>
                Profile
              </a>
              <a className={styles["dropdown-item"]} href="/">
                <i className="align-middle me-1" data-feather="pie-chart"></i>
                Analytics
              </a>
              <div className={styles["dropdown-divider"]}></div>
              <a className={styles["dropdown-item"]} href="index.html">
                <i className="align-middle me-1" data-feather="settings"></i>
                Settings & Privacy
              </a>
              <a className={styles["dropdown-item"]} href="/">
                <i className="align-middle me-1" data-feather="help-circle"></i>
                Help Center
              </a>
              <div className={styles["dropdown-divider"]}></div>
              <a className={styles["dropdown-item"]} href="/">
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
