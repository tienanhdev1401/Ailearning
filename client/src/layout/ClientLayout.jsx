import React, { useContext, useEffect } from "react";
import Header from "../client/components/Header";
import Footer from "../client/components/Footer";
import styles from "../client/styles/ClientLayout.module.css";

import { HighlightContext } from "../context/HighlightContext";
import TranslatePopup from "../component/TranslatePopup";

const ClientLayout = ({ children }) => {

  const { handleSelection } = useContext(HighlightContext);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [handleSelection]);


  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
      <TranslatePopup />
    </div>
  );
};

export default ClientLayout;
