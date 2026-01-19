import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TransformerGrid from "../components/TransformerGrid";
import "../styles/layout.css"; // important

const Dashboard = () => {
  return (
    <div className="layout">
      <Sidebar />

      <div className="main-content">
        <Header />
        <TransformerGrid />
      </div>
    </div>
  );
};

export default Dashboard;
