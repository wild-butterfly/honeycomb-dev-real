import React from "react";
import styles from "./HelpPage.module.css";

const HelpPage: React.FC = () => {
  return (
    <div className={styles.helpBg}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Need Help?</h1>
        <p className={styles.subtitle}>
          We're here for you! Find answers to common questions or reach out to our support team.
        </p>
      </section>

      {/* FAQ SECTION */}
      <section className={styles.faqSection}>
        <h2 className={styles.heading}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h3 className={styles.q}>How do I reset my password?</h3>
            <p className={styles.a}>
              Click <a href="/forgot" className={styles.link}>Forgot password?</a> on the login page and follow the instructions to reset your password.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.q}>How can I contact support?</h3>
            <p className={styles.a}>
              Email us any time at <a href="mailto:support@honeycomb.com.au" className={styles.link}>support@honeycomb.com.au</a> or use the <a href="/contact" className={styles.link}>Contact form</a>.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.q}>How do I add a new user or team member?</h3>
            <p className={styles.a}>
              Go to <strong>Settings</strong> &rarr; <strong>Team</strong> and click "Add User". Enter their details and send them an invite.
            </p>
          </div>
          <div className={styles.faqItem}>
            <h3 className={styles.q}>Can I try Honeycomb for free?</h3>
            <p className={styles.a}>
              Yes! Every plan comes with a free trial. Check our <a href="/pricing" className={styles.link}>Pricing</a> page for details.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className={styles.contactSection}>
        <h2 className={styles.heading}>Still need help?</h2>
        <p className={styles.contactText}>
          If you can't find the answer you're looking for, our friendly team is just a click away.
        </p>
        <a href="/contact" className={styles.contactBtn}>Contact Support</a>
      </section>
    </div>
  );
};

export default HelpPage;
