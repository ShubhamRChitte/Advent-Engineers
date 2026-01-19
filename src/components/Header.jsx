import "../styles/header.css";

const Header = () => {
  return (
    <header className="header">
      <div>
        <h2>ADVENT ENGINEERS</h2>
        <span>Admin Panel</span>
      </div>

      <div className="header-right">
        <span className="bell">🔔</span>
        <div className="user">
          <strong>Moni Roy</strong>
          <small>Administrator</small>
        </div>
        <button className="logout">Logout</button>
      </div>
    </header>
  );
};

export default Header;
