import React, { useState } from "react";
import styles from "./NewJobModal.module.css";

const AddCustomerForm: React.FC = () => {
  // Ana form state'leri
  const [showExtra, setShowExtra] = useState(false);

  // Alan state örnekleri
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [contactType, setContactType] = useState("Mobile");
  const [contactValue, setContactValue] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");

  // Ek alanlar (postal/billing/contact/settings)
  const [postalAddress, setPostalAddress] = useState("");
  const [billingContact, setBillingContact] = useState("");
  const [pricingTier, setPricingTier] = useState("Always use default");
  const [paymentTerms, setPaymentTerms] = useState("Use company default");
  const [cardPaymentFee, setCardPaymentFee] = useState("Company Setting");

  return (
    <form className={styles.addCustomerModal} autoComplete="off">
      <h2>Add New Customer</h2>
      {/* Ana Alanlar */}
      <label>
        Customer/Company name *
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Enter company or customer name"
          required
        />
      </label>
      <label>
        Customer source
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Select...</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          {/* ... */}
        </select>
      </label>

      <h3 style={{ marginTop: 16 }}>Default main contact</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1 }}>
          First name *
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
          />
        </label>
        <label style={{ flex: 1 }}>
          Last name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
          />
        </label>
      </div>
      <label>
        Title/Position
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1 }}>
          Contact type
          <select
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
          >
            <option>Mobile</option>
            <option>Phone</option>
            <option>Email</option>
          </select>
        </label>
        <label style={{ flex: 2 }}>
          <span style={{ opacity: 0 }}>Type</span>
          <input
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder={`Enter ${contactType.toLowerCase()}`}
          />
        </label>
      </div>

      <label>
        Physical Address
        <input
          value={physicalAddress}
          onChange={(e) => setPhysicalAddress(e.target.value)}
          placeholder="Search for address or enter manually"
        />
      </label>

      {/* Açılır-kapanır alan */}
      <div style={{ margin: "16px 0" }}>
        <button
          type="button"
          style={{
            color: "#a48a24",
            background: "none",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
            padding: 0,
            fontWeight: 500,
          }}
          onClick={() => setShowExtra((e) => !e)}
        >
          {showExtra
            ? "− Hide extra fields"
            : "+ Add postal address, billing contact, other contacts, customer settings"}
        </button>
      </div>

      {showExtra && (
        <div
          style={{
            background: "#fcf9ed",
            border: "1px solid #edd96b",
            borderRadius: 8,
            padding: 16,
            marginBottom: 8,
            marginTop: 0,
          }}
        >
          <h4>Postal Address</h4>
          <input
            value={postalAddress}
            onChange={(e) => setPostalAddress(e.target.value)}
            placeholder="Enter postal address"
          />

          <h4>Billing Contact</h4>
          <input
            value={billingContact}
            onChange={(e) => setBillingContact(e.target.value)}
            placeholder="Enter billing contact name"
          />

          {/* Diğer kontaklar, ayarlar, ekstra alanlar... */}
          <h4>Customer Settings</h4>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Pricing Tier
              <select
                value={pricingTier}
                onChange={(e) => setPricingTier(e.target.value)}
              >
                <option>Always use default</option>
                <option>Tier 1</option>
                <option>Tier 2</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Payment terms
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option>Use company default</option>
                <option>30 days</option>
                <option>14 days</option>
                <option>7 days</option>
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Card Payment Fee
              <select
                value={cardPaymentFee}
                onChange={(e) => setCardPaymentFee(e.target.value)}
              >
                <option>Company Setting</option>
                <option>None</option>
                <option>1%</option>
                <option>2%</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button type="button" className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" className={styles.createBtn}>
          Save Customer
        </button>
      </div>
    </form>
  );
};

export default AddCustomerForm;
