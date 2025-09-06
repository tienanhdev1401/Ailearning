import Sidebar from "../client/components/Sidebar";
import styles from "../client/styles/ClientLayout.module.css";

const ClientLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      {children}
    </div>
  );
};

export default ClientLayout;
