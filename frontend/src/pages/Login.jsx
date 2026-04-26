import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { saveUserSession } from "../utils/auth";
import { API_BASE } from "../utils/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      saveUserSession(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Login</h2>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <div style={{ color: "red" }}>{error}</div> : null}

        <button onClick={login}>Login</button>

        <div style={{ marginTop: "12px" }}>
          Need an account? <Link to="/signup">Signup</Link>
        </div>
      </div>
    </div>
  );
}