import Sidebar from "./Sidebar";
import Header from "./Header";
import "../styles/layout.css";

const AdminLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="content-wrapper">
        <Header />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
