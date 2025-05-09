import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.message || "Failed to login");
      } else {
        setSuccess(`Successfully logged in as ${username}`);
        // Clear form
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">      <h2>Login</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="demo-accounts">
        <h3>Demo Accounts</h3>
        <p>
          <strong>Admin:</strong> username: admin, password: admin
        </p>
        <p>
          <strong>Manager:</strong> username: manager, password: manager
        </p>
        <p>
          <strong>HR:</strong> username: hr, password: hr
        </p>
        <p>
          <strong>Employee:</strong> username: employee, password: employee
        </p>
      </div>
    </div>
  );
};

export default Login;
