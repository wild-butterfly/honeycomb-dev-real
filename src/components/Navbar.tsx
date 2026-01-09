import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <img src="/bee.png" alt="Logo" className={styles.logo} />
      </div>

      {/* Hamburger icon always visible on mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Open menu"
        aria-expanded={menuOpen}
      >
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ""}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ""}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ""}`} />
      </button>

      {/* MENU - responsive */}
      <div className={`${styles.menu} ${menuOpen ? styles.open : ""}`}>
        <div className={styles.center}>
          <Link className={styles.link} to="/" onClick={handleLinkClick}>
            Home
          </Link>
          <Link className={styles.link} to="/features" onClick={handleLinkClick}>
            Features
          </Link>
          <Link className={styles.link} to="/pricing" onClick={handleLinkClick}>
            Pricing
          </Link>
          <Link className={styles.link} to="/about" onClick={handleLinkClick}>
            About Us
          </Link>
          <Link className={styles.link} to="/help" onClick={handleLinkClick}>
            Help
          </Link>
        </div>
        <div className={styles.right}>
          <Link className={styles.btn} to="/login" onClick={handleLinkClick}>
            Log In
          </Link>
          <Link className={styles.btnSecondary} to="/signup" onClick={handleLinkClick}>
            Sign Up
          </Link>
        </div>
      </div>

      {/* Overlay for closing menu by clicking outside (mobile UX) */}
      {menuOpen && (
        <div className={styles.menuOverlay} onClick={handleLinkClick}></div>
      )}
    </nav>
  );
};

export default Navbar;
