import React, { useState } from "react";
import styles from "./ForgotPasswordPage.module.css";

const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className={styles.pageBg}>
      <div className={styles.card}>
        <h1 className={styles.title}>Forgot your password?</h1>
        <p className={styles.infoText}>
          Enter your email address and we’ll send you a link to reset your password.
        </p>
        {!submitted ? (
          <form
            className={styles.form}
            onSubmit={e => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              autoFocus
            />
            <button type="submit" className={styles.btn}>
              Send Reset Link
            </button>
          </form>
        ) : (
          <div className={styles.successMsg}>
            If your email exists, a reset link has been sent. Please check your inbox!
          </div>
        )}
        <div className={styles.footerLinks}>
          <a className={styles.link} href="/login">Back to Log In</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
