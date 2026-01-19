import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OrderForm from "./pages/OrderForm";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/order" element={<OrderForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
