import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import { apiPost } from "../services/api";
import { useCompany } from "../context/CompanyContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { reloadCompanies } = useCompany();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await apiPost<{
        token: string;
        user: {
          id: number;
          email: string;
          role: string;
          company_id: number;
          employee_id?: number;
        };
      }>("/auth/login", {
        email,
        password,
      });

      if (!res?.token) {
        throw new Error("No token returned");
      }

      // ✅ JWT'yi kaydet
      localStorage.setItem("token", res.token);

      // ✅ Store user data including role
      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      // ✅ Reload companies list (fixes company switcher not showing companies until refresh)
      await reloadCompanies();

      // ✅ Dashboard'a yönlendir
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError("Login failed");
    }
  };

  return (
    <div className={styles.loginBg}>
      <main className={styles.card}>
        <img src="/leaf-fall.png" alt="Leaf icon" className={styles.beeCorner} />

        <h1 className={styles.title}>
          Log In to <span>Honeycomb</span>
        </h1>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className={styles.label}>Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button className={styles.submit} type="submit">
            Log In
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
