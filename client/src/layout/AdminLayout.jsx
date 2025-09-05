// src/layouts/AdminLayout.jsx
import React, { useEffect } from "react";
import Sidebar from "../admin/components/Sidebar";
import Navbar from "../admin/components/Navbar";
import Footer from "../admin/components/Footer";
import feather from "feather-icons";

import '../admin/AdminPage.css'

const AdminLayout = ({ children }) => {
  useEffect(() => {
    feather.replace(); // load feather icons
  }, []);

  return (
    <div className="wrapper">
      <Sidebar />
      <div className="main">
        <Navbar />
        <main className="content">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminLayout;
