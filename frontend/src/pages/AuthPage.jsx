import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, loading } = useApp();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (mode === "register" && name.length < 2) {
      toast.error("Full name kam se kam 2 characters ka hona chahiye");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Valid email address enter karo");
      return;
    }

    if (password.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }

    try {
      if (mode === "login") {
        const data = await login({ email, password });
        navigate(data.role === "admin" ? "/admin" : "/");
      } else {
        await register({ ...form, name, email, password });
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <section className="container section-gap auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "login" ? "Login" : "Create account"}</h2>
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </button>

        <button
          type="button"
          className="text-btn"
          onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
        >
          {mode === "login" ? "New user? Register" : "Already have an account? Login"}
        </button>
      </form>
    </section>
  );
};

export default AuthPage;
