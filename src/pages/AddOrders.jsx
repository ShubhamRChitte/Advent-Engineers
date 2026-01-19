import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TransformerGrid from "../components/TransformerGrid";

const AddOrders = () => {
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

export default AddOrders;
