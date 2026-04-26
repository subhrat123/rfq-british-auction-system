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
    <div
      className="card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div>
        <Link to="/">Home</Link>
        {user?.role === "buyer" ? (
          <>
            {' '}
            | <Link to="/create-rfq">Create RFQ</Link>
          </>
        ) : null}
      </div>
      <div>
        {user ? (
          <>
            <span>
              {user.name} ({user.role})
            </span>
            <button
              style={{ marginLeft: "12px", background: "#f25c54" }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link> | <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </div>
  );
}
