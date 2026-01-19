import "../styles/sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <h1>Advent</h1>
      </div>

      <ul className="menu">
        <li>Dashboard</li>
        <li>Employees</li>
        <li>Performance</li>
        <li className="active">Add Orders</li>
        <li>View Orders</li>
        <li>Core Tracking</li>
        <li>Stock</li>
        <li>Reports</li>
        <li>Notifications</li>
      </ul>
    </aside>
  );
};

export default Sidebar;
