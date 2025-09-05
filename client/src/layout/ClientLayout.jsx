import Sidebar from '../client/components/Sidebar';
import '../client/styles/Home.css'

const ClientLayout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main" role="main">
        {children}
      </main>
    </div>
  );
};

export default ClientLayout;
