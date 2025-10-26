import React, { useContext, useEffect } from "react";
import Sidebar from "../client/components/Sidebar";
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
      <Sidebar />
      {children}
      <TranslatePopup />
    </div>
  );
};

export default ClientLayout;
