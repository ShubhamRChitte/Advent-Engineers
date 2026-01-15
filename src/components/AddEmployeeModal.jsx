import { useState } from "react";

function AddEmployeeModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");

  const submit = (e) => {
    e.preventDefault();

    onAdd({
      id: Date.now(),
      name,
      email,
      role,
      department: dept,
      status: "active",
      date: "Today",
      avatar: name[0],
    });
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Add New Employee</h3>
          <span onClick={onClose}>✖</span>
        </div>

        <p>Fill in the details to add a new employee.</p>

        <form onSubmit={submit}>
          <input placeholder="Full Name" onChange={e => setName(e.target.value)} />
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <select onChange={e => setRole(e.target.value)}>
            <option>Select role</option>
            <option>Admin</option>
            <option>Entry Operator</option>
            <option>Core Tester</option>
          </select>
          <input placeholder="Department" onChange={e => setDept(e.target.value)} />
          <button className="add-btn full">Add Employee</button>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;
