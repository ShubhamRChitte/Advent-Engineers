import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderView from "./components/orders/OrderView";
import OrderViewPage from "./components/orders/OrderViewPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrderView role="admin" />} />
        <Route path="/orders/:orderId/view" element={<OrderViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
