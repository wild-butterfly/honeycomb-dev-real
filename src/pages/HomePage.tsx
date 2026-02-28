// HomePage.tsx
import React, { useEffect } from "react";
import styles from "./HomePage.module.css";

const HomePage: React.FC = () => {
  useEffect(() => {
    const img = new Image();
    img.src = "/leaf-fall.png";
  }, []);

  return (
    <div className={styles.homepage}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to Flowody</h1>

        <p className={styles.subtitle}>
          Where work flows naturally.
        </p>
        <p className={styles.subtitle}>
          <span className={styles.accentLine}>
            Everything your business needs to stay in flow.
          </span>
        </p>

        {/* CTA + Leaf */}
        <div className={styles.ctaWrap}>
          <a href="/signup" className={styles.ctaBtn}>
            Get Started
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Why Honeycomb?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.icon}>
              <img src="/job-management.png" alt="Job management icon" />
            </span>
            <h3>Effortless Job Management</h3>
            <p>
              Plan, track, and complete work with clarity and control - all in
              one place.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.icon}>
              <img src="/team.png" alt="Team coordination icon" />
            </span>
            <h3>Seamless Team Coordination</h3>
            <p>
              Keep your team aligned with real-time updates, assignments, and
              progress.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.icon}>
              <img src="/intagraions.png" alt="Business integrations icon" />
            </span>
            <h3>Powerful Business Integrations</h3>
            <p>
              Connect your tools, automate workflows, and keep your business
              moving.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;


