import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, requestLoginOtp, verifyLoginOtp, loading } = useApp();
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState("password");
  const [otpStep, setOtpStep] = useState("request");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (mode === "login" && loginMethod === "otp") {
      if (!isValidEmail(email)) {
        toast.error("Valid email address enter karo");
        return;
      }

      try {
        if (otpStep === "request") {
          await requestLoginOtp({ email });
          setOtpStep("verify");
          return;
        }

        if (!/^\d{6}$/.test(otpCode.trim())) {
          toast.error("6-digit code enter karo");
          return;
        }

        const data = await verifyLoginOtp({ email, otp: otpCode.trim() });
        navigate(data.role === "admin" ? "/admin" : "/");
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || "OTP login failed");
        return;
      }
    }

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

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setLoginMethod("password");
    setOtpStep("request");
    setOtpCode("");
    setForm({ name: "", email: "", password: "" });
  };

  const switchLoginMethod = (nextMethod) => {
    setLoginMethod(nextMethod);
    setOtpStep("request");
    setOtpCode("");
  };

  return (
    <section className="container section-gap auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === "login" ? "Login" : "Create account"}</h2>
        {mode === "login" && (
          <div className="two-col-grid">
            <button
              type="button"
              className={loginMethod === "password" ? "primary-btn" : "ghost-btn"}
              onClick={() => switchLoginMethod("password")}
            >
              Password Login
            </button>
            <button
              type="button"
              className={loginMethod === "otp" ? "primary-btn" : "ghost-btn"}
              onClick={() => switchLoginMethod("otp")}
            >
              Email Code Login
            </button>
          </div>
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
        />
        {(mode === "register" || loginMethod === "password") && (
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        )}
        {mode === "login" && loginMethod === "otp" && otpStep === "verify" && (
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit code"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        )}
        {mode === "login" && loginMethod === "otp" && (
          <p className="helper-text">
            {otpStep === "request"
              ? "Email dalke code mangao. Code aane ke baad yahin enter karke login ho jaoge."
              : "Email me aaya 6-digit code yahan dalo aur verify karo."}
          </p>
        )}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login" && loginMethod === "otp"
              ? otpStep === "request"
                ? "Send Login Code"
                : "Verify Code"
              : mode === "login"
                ? "Login"
                : "Register"}
        </button>

        {mode === "login" && loginMethod === "otp" && otpStep === "verify" && (
          <button
            type="button"
            className="text-btn"
            onClick={async () => {
              const email = form.email.trim().toLowerCase();
              if (!isValidEmail(email)) {
                toast.error("Valid email address enter karo");
                return;
              }

              try {
                await requestLoginOtp({ email });
              } catch (error) {
                toast.error(error.response?.data?.message || "Code resend failed");
              }
            }}
          >
            Resend code
          </button>
        )}

        <button
          type="button"
          className="text-btn"
          onClick={switchMode}
        >
          {mode === "login" ? "New user? Register" : "Already have an account? Login"}
        </button>
      </form>
    </section>
  );
};

export default AuthPage;
