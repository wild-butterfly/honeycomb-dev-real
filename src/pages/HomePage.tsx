// HomePage.tsx
import React, { useEffect } from "react";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  // Bee görselini önden yükle
  useEffect(() => {
    const img = new Image();
    img.src = "/flyingbee.png";
  }, []);

  return (
    <div className={styles.homepage}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to Honeycomb</h1>
        <p className={styles.subtitle}>
          Smart workflow management,<br />
          <span style={{ color: "#c2990d", fontWeight: 600 }}>
            as sweet as honey—made for business.
          </span>
        </p>

        {/* CTA + Bee */}
        <div className={styles.ctaWrap}>
          <a href="/signup" className={styles.ctaBtn}>Get Started</a>
          <img
            src="/flyingbee.png"
            alt="Flying bee"
            className={styles.flyingBee}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Why Honeycomb?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.icon}>🍯</span>
            <h3>Effortless Task Tracking</h3>
            <p>Track every job, deadline and update in one beautiful dashboard.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.icon}>🐝</span>
            <h3>Team Collaboration</h3>
            <p>Assign tasks, share updates, and work seamlessly with your team.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.icon}>📈</span>
            <h3>Business-Ready Integrations</h3>
            <p>Sync your workflow and invoices directly with Xero and more.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
