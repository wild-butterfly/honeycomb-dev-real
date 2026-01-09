import React from "react";
import styles from "./LoginPage.module.css";

const LoginPage: React.FC = () => {
  return (
    <div className={styles.loginBg}>
      <main className={styles.card} role="main" aria-labelledby="loginTitle">
        {/* 🐝 Sevimli arı köşede */}
        <img
          src="/cutebee.png"
          alt="Bee mascot"
          className={styles.beeCorner}
        />

        <h1 id="loginTitle" className={styles.title}>
          Log In to <span>Honeycomb</span>
        </h1>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            required
          />

          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className={styles.input}
            required
          />

          <button className={styles.submit} type="submit">
            Log In
          </button>

          <div className={styles.linksRow}>
            <a href="/forgot" className={styles.link}>
              Forgot password?
            </a>
            <span className={styles.dot}>•</span>
            <a href="/signup" className={styles.link}>
              Create account
            </a>
          </div>
        </form>
      </main>
    </div>
  );
};

export default LoginPage;
