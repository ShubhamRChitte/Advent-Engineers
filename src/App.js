import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AddOrders from "./pages/AddOrders";
import OrderForm from "./pages/OrderForm";
import TransformersPage from "./pages/TransformersPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-orders" element={<AddOrders />} />
        <Route path="/order-form" element={<OrderForm />} />
        <Route path="/transformers" element={<TransformersPage />} />
      </Routes>
    </Router>
  );
}

export default App;
