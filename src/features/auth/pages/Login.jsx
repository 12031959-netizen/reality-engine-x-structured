import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useAuth } from "../../../hooks/useAuth";

export default function Login({ setAuthRoute }) {
  const { login } = useAuth();
  const [loginRole, setLoginRole] = useState("user");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await login(identifier, password, loginRole);

    if (!result.ok) {
      setError(result.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Login to Reality Engine X</h1>

        <div className="role-selector" aria-label="Choose login type">
          <button
            className={loginRole === "user" ? "active" : ""}
            type="button"
            onClick={() => {
              setLoginRole("user");
              setError("");
            }}
          >
            User
          </button>
          <button
            className={loginRole === "admin" ? "active" : ""}
            type="button"
            onClick={() => {
              setLoginRole("admin");
              setIdentifier("admin");
              setError("");
            }}
          >
            Admin
          </button>
        </div>

        <Input
          label="Username or email"
          autoComplete="username"
          placeholder={loginRole === "admin" ? "admin" : "Your username or email"}
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            setError("");
          }}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={error}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
        />

        <Button type="submit">Login</Button>

        <div className="auth-links">
          <button type="button" onClick={() => setAuthRoute("signup")}>
            Create account
          </button>
          <button type="button" onClick={() => setAuthRoute("forgot")}>
            Reset password
          </button>
        </div>
      </form>
    </section>
  );
}
