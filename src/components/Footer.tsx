import React from "react";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.links}>
          <a href="/privacy" className={styles.link}>
            Privacy Policy
          </a>
          <a href="/terms" className={styles.link}>
            Terms
          </a>
          <a href="/contact" className={styles.link}>
            Contact
          </a>
        </div>
        <div className={styles.right}>
          <span>© 2026 Flowody</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
