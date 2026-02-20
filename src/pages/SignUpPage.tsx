import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SignUpPage.module.css";
import { register } from "../services/api";

// B) Eğer resmi public yerine src altında tutuyorsan bu satırı aç:
// import winkingBee from "../../assets/winkingbee.png";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Email and password are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        email,
        password,
        company_name: companyName || name || undefined,
      });

      // Store user data including role
      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      // Registration successful, redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageBg}>
      <main className={styles.card} role="main" aria-labelledby="signupTitle">
        {/* 🐝 Köşedeki arı (Login ile aynı yapı) */}
        {/* A) public klasörü: */}
        <img
          src="/winkingbee.png"
          alt="Bee mascot"
          className={styles.beeCorner}
          loading="eager"
          decoding="async"
        />
        {/* B) src/assets içinden import ediyorsan: */}
        {/* <img src={winkingBee} alt="Bee mascot" className={styles.beeCorner} /> */}

        <h1 id="signupTitle" className={styles.title}>
          Create your Honeycomb <span>account</span>
        </h1>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c33",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="name">
            Full Name (Optional)
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={loading}
          />

          <label className={styles.label} htmlFor="companyName">
            Company Name (Optional)
          </label>
          <input
            id="companyName"
            type="text"
            placeholder="Your company name"
            className={styles.input}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={loading}
          />

          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Create a password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <label className={styles.label} htmlFor="confirm">
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            placeholder="Repeat your password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>

          <div className={styles.footerLinks}>
            <a href="/login" className={styles.link}>
              Already have an account?
            </a>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SignUpPage;
