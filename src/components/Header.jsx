function Header() {
  return (
    <div className="header-bar">
      <div>
        <h3>ADVENT ENGINEERS</h3>
        <span>Admin Panel</span>
      </div>

      <div className="header-right">
        <span className="bell">
          🔔<sup>3</sup>
        </span>
        <span>Moni Roy</span>
        <div className="avatar">M</div>
        <button className="logout">Logout</button>
      </div>
    </div>
  );
}

export default Header;


