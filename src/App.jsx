import { useState } from "react";
import Header from "./components/Header";
import SummaryCards from "./components/Summary";
import EmployeeTable from "./components/EmployeeTable";
import AddEmployeeModal from "./components/AddEmployeeModal";
import "./App.css";

function App() {
  const [showModal, setShowModal] = useState(false);

  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: "Moni Roy",
      email: "admin@advent.com",
      role: "Admin",
      department: "Management",
      status: "active",
      date: "1/15/2023",
      avatar: "M",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "entry@advent.com",
      role: "Entry Operator",
      department: "Operations",
      status: "active",
      date: "3/20/2023",
      avatar: "S",
    },
    {
      id: 3,
      name: "John Smith",
      email: "core@advent.com",
      role: "Core Tester",
      department: "Core Testing",
      status: "active",
      date: "5/10/2023",
      avatar: "J",
    },
  ]);

  const addEmployee = (emp) => {
    setEmployees([...employees, emp]);
    setShowModal(false);
  };

  return (
    <>
      <Header />

      <div className="page">
        <div className="page-content">
          <div className="page-header">
            <div>
              <h2>Employee Management</h2>
              <p>Manage system users and their roles</p>
            </div>

            <button className="add-btn" onClick={() => setShowModal(true)}>
              ➕ Add Employee
            </button>
          </div>

          <SummaryCards employees={employees} />
          <EmployeeTable employees={employees} />
        </div>
      </div>

      {showModal && (
        <AddEmployeeModal
          onClose={() => setShowModal(false)}
          onAdd={addEmployee}
        />
      )}
    </>
  );
}

export default App;
