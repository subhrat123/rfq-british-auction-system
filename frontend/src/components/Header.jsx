import { Link, useNavigate } from "react-router-dom";
import { clearUserSession, getUser } from "../utils/auth";

export default function Header() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link to="/" className="brand">
          RFQ<span>Auction</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Auctions</Link>

          {user?.role === "buyer" && (
            <Link to="/create-rfq">Create RFQ</Link>
          )}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login">Login</Link>
              <Link to="/signup" className="signup-button">
                Sign up
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}