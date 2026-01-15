function SummaryCards({ employees }) {
  return (
    <div className="cards">
      <div className="card">
        <p>Total Employees</p>
        <h3>{employees.length}</h3>
      </div>
      <div className="card">
        <p>Admins</p>
        <h3>1</h3>
      </div>
      <div className="card">
        <p>Entry Operators</p>
        <h3>1</h3>
      </div>
      <div className="card">
        <p>Testers</p>
        <h3>3</h3>
      </div>
      <div className="card">
        <p>Active</p>
        <h3 className="green">5</h3>
      </div>
    </div>
  );
}

export default SummaryCards;
