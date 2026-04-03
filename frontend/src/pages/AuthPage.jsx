import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, verifyEmailOtp, resendEmailOtp, loading } = useApp();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    try {
      if (mode === "verify") {
        await verifyEmailOtp({ email: verificationEmail, otp });
        navigate("/");
        return;
      }

      if (mode === "login") {
        const data = await login({ email: form.email, password: form.password });
        navigate(data.role === "admin" ? "/admin" : "/");
      } else {
        const data = await register(form);
        if (data?.requiresEmailVerification) {
          setVerificationEmail(data.email || form.email);
          setOtp("");
          setMode("verify");
          toast.success(data.message || "OTP sent to your email");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      if (error.response?.data?.requiresEmailVerification) {
        setVerificationEmail(error.response.data.email || form.email);
        setOtp("");
        setMode("verify");
      }
      toast.error(error.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <section className="container section-gap auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "login" ? "Login" : mode === "register" ? "Create account" : "Verify email"}</h2>
        {mode === "verify" && (
          <p className="helper-text">
            OTP us email par gaya hai jo aap use kar rahe ho: <strong>{verificationEmail}</strong>
          </p>
        )}
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
          disabled={mode === "verify"}
        />
        {mode !== "verify" ? (
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        ) : (
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        )}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : mode === "register" ? "Register" : "Verify Email"}
        </button>

        {mode === "verify" ? (
          <>
            <button
              type="button"
              className="ghost-btn"
              disabled={loading}
              onClick={() => resendEmailOtp({ email: verificationEmail })}
            >
              Resend OTP
            </button>
            <button
              type="button"
              className="text-btn"
              onClick={() => setMode("login")}
            >
              Back to Login
            </button>
          </>
        ) : (
          <button
            type="button"
            className="text-btn"
            onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "New user? Register" : "Already have an account? Login"}
          </button>
        )}
      </form>
    </section>
  );
};

export default AuthPage;
