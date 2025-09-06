import React from "react";
import styles from "../../admin/AdminPage.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles["container-fluid"]}>
        <div className="text-muted">© 2025 AdminKit</div>
      </div>
    </footer>
  );
};

export default Footer;
