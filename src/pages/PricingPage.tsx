import React from "react";
import styles from "./PricingPage.module.css";

const plans = [
  {
    name: "Starter",
    price: "$19",
    period: "per user / month",
    features: [
      "Up to 2 users",
      "Job & Task Management",
      "Mobile Access",
      "Unlimited Jobs",
      "Basic Support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Team",
    price: "$39",
    period: "per user / month",
    features: [
      "Up to 10 users",
      "All Starter features",
      "Team Collaboration",
      "Quotes & Invoicing",
      "Email & Chat Support",
      "Xero Integration",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$69",
    period: "per user / month",
    features: [
      "Unlimited users",
      "All Team features",
      "Custom Branding",
      "Advanced Reporting",
      "Priority Support",
      "API Access",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const PricingPage: React.FC = () => {
  return (
    <div className={styles.pricingBg}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Pricing</h1>
        <p className={styles.subtitle}>
          Simple, transparent plans for every business. <br />
          No lock-in, no surprises.
        </p>
      </section>
      <section className={styles.plansGrid}>
        {plans.map((plan, idx) => (
          <div
            className={`${styles.card} ${plan.highlight ? styles.popular : ""}`}
            key={plan.name}
          >
            {plan.highlight && (
              <span className={styles.mostPopular}>Most Popular</span>
            )}
            <h2 className={styles.planName}>{plan.name}</h2>
            <div className={styles.priceRow}>
              <span className={styles.price}>{plan.price}</span>
              <span className={styles.period}>/{plan.period}</span>
            </div>
            <ul className={styles.featuresList}>
              {plan.features.map((feat) => (
                <li key={feat}>{feat}</li>
              ))}
            </ul>
            <button className={styles.pricingBtn}>{plan.cta}</button>
          </div>
        ))}
      </section>
      <div className={styles.fineprint}>
        * All prices in AUD. <br />
        All plans include free setup and secure cloud backup.
      </div>
    </div>
  );
};

export default PricingPage;
