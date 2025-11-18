import React from "react";
import Header from "../client/components/Header";
import Footer from "../client/components/Footer";
import styles from "../client/styles/ClientLayout.module.css";
import TranslatePopup from "../component/TranslatePopup";

const ClientLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
      <TranslatePopup />
    </div>
  );
};

export default ClientLayout;
