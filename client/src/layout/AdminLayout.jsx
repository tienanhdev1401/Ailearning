// src/layouts/AdminLayout.jsx
import React, { useEffect } from "react";
import Sidebar from "../admin/components/Sidebar";
import Navbar from "../admin/components/Navbar";
import Footer from "../admin/components/Footer";
import feather from "feather-icons";

import styles from "../admin/AdminPage.module.css";

const AdminLayout = ({ children }) => {
  useEffect(() => {
    feather.replace(); // load feather icons
  }, []);

  return (
    <div className={styles.wrapper}>
    <Sidebar />
    <div className={styles.main}>
        <Navbar />
        <main className={styles.content}>{children}</main>
        <Footer />
    </div>
    </div>
  );
};

export default AdminLayout;
