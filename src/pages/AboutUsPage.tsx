import React from "react";
import styles from "./AboutUsPage.module.css";

const AboutUsPage: React.FC = () => {
  return (
    <div className={styles.aboutBg}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Meet the Team Behind Honeycomb</h1>
        <p className={styles.subtitle}>
          Building smart, simple and delightful business tools – together!
        </p>
      </section>

      <section className={styles.storySection}>
        <h2 className={styles.heading}>Our Story</h2>
        <p className={styles.text}>
          <strong>Honeycomb</strong> was founded by a group of tradespeople and software enthusiasts who knew there had to be a better way to manage jobs, teams, and customers. Tired of paperwork, lost jobs, and stressful admin, we set out to build a tool that feels as sweet as honey.
        </p>
        <p className={styles.text}>
          Our goal is to make your workday easier. Whether you run a small business or manage a large team, Honeycomb helps you stay organised, collaborate efficiently, and focus on what matters most: <span className={styles.highlight}>growing your business</span>.
        </p>
      </section>

      <section className={styles.valuesSection}>
        <h2 className={styles.heading}>Our Values</h2>
        <ul className={styles.valuesList}>
          <li><span className={styles.icon}>🤝</span> Friendly, real support</li>
          <li><span className={styles.icon}>🔍</span> Transparency & honesty</li>
          <li><span className={styles.icon}>🚀</span> Always improving</li>
          <li><span className={styles.icon}>🐝</span> Community first</li>
        </ul>
      </section>

      <section className={styles.teamSection}>
        <h2 className={styles.heading}>Who We Are</h2>
        <div className={styles.teamGrid}>
          <div className={styles.memberCard}>
            <img className={styles.avatar} src="/bee.png" alt="Daniel, Founder" />
            <h3 className={styles.memberName}>Aşkın Fear</h3>
            <p className={styles.memberRole}>Founder & Lead Developer</p>
          </div>
          <div className={styles.memberCard}>
            <img className={styles.avatar} src="/bee.png" alt="Aşkın, Customer Success" />
            <h3 className={styles.memberName}>Beril Köse</h3>
            <p className={styles.memberRole}>Customer Success & Support</p>
          </div>
        </div>
      </section>

      <section className={styles.contactSection}>
        <h2 className={styles.heading}>Let’s Connect</h2>
        <p className={styles.text}>
          Got a question, suggestion, or just want to say hi? We’d love to hear from you!
        </p>
        <a href="/contact" className={styles.contactBtn}>Contact Us</a>
      </section>
    </div>
  );
};

export default AboutUsPage;
