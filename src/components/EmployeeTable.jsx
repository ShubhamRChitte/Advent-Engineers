function EmployeeTable({ employees }) {
  return (
    <div className="table-box">
      <h3>All Employees</h3>

      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Join Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td className="emp">
                <div className="avatar">{emp.avatar}</div>
                <div>
                  <strong>{emp.name}</strong><br />
                  <small>{emp.email}</small>
                </div>
              </td>

              <td>
                <span className={`role ${emp.role.replace(" ", "").toLowerCase()}`}>
                  {emp.role}
                </span>
              </td>

              <td>{emp.department}</td>

              <td>
                <span className="status active">{emp.status}</span>
              </td>

              <td>{emp.date}</td>

              <td>✏️ 🗑️</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;
