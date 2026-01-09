import React from "react";
import styles from "./FeaturesPage.module.css";

const features = [
  {
    icon: "📋",
    title: "Job & Task Management",
    description:
      "Easily create, assign, and track jobs, tasks and deadlines. Stay on top of every job from start to finish with a clean dashboard.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    description:
      "Invite your whole team, assign roles, comment on jobs, and keep everyone in sync—wherever they are.",
  },
  {
    icon: "📱",
    title: "Mobile Access",
    description:
      "Work from anywhere with our fully responsive app. Add notes, upload photos, or update job status on the go.",
  },
  {
    icon: "💰",
    title: "Quotes & Invoicing",
    description:
      "Generate and send professional quotes and invoices in seconds. Integrated with Xero for seamless accounting.",
  },
  {
    icon: "🔗",
    title: "Integrations",
    description:
      "Connect Honeycomb with your favorite tools: Xero, Outlook, Google Calendar, and more.",
  },
  {
    icon: "🔔",
    title: "Reminders & Notifications",
    description:
      "Automatic reminders keep your jobs, deadlines, and team communications on track.",
  },
];

const FeaturesPage: React.FC = () => {
  return (
    <div className={styles.featuresBg}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Features built for modern teams</h1>
        <p className={styles.subtitle}>
          All-in-one workflow, quoting, and job management—beautifully simple.
        </p>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div className={styles.featureCard} key={idx}>
              <span className={styles.icon}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
