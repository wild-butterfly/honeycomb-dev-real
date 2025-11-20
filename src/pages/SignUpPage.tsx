import React from "react";
import styles from "./SignUpPage.module.css";

// B) Eğer resmi public yerine src altında tutuyorsan bu satırı aç:
// import winkingBee from "../../assets/winkingbee.png";

const SignUpPage: React.FC = () => {
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

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label className={styles.label} htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Your name"
            className={styles.input}
            autoFocus
            required
          />

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
            placeholder="Create a password"
            className={styles.input}
            required
          />

          <label className={styles.label} htmlFor="confirm">
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            placeholder="Repeat your password"
            className={styles.input}
            required
          />

          <button className={styles.btn} type="submit">
            Sign Up
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
