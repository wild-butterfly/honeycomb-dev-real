import React, { useState } from "react";
import styles from "./AddCustomerModal.module.css";

// Contact ve Settings tipleri
type Contact = {
  firstName: string;
  lastName: string;
  title: string;
  contactType: string;
  contactValue: string;
};

type Address = {
  address: string;
  room: string;
  city: string;
  suburb: string;
  postcode: string;
  state: string;
  country: string;
};

type CustomerSettings = {
  pricingTier: string;
  paymentTerms: string;
  cardPaymentFee: string;
  chargeOutRate: string;
  materialDiscount: string;
  labourDiscount: string;
  customTaxRate: string;
  disableInvoiceReminders: string;
  attachInvoicePdf: boolean;
  disableQuoteReminders: string;
};

const contactTypes = ["Mobile", "Phone", "Email"];
const pricingTiers = ["Always use default", "Tier 1", "Tier 2", "Tier 3"];
const paymentTerms = ["Use company default", "30 days", "14 days", "7 days"];
const cardPaymentFees = ["Company Setting", "None", "1%", "2%"];

type AddCustomerModalProps = {
  show: boolean;
  onClose: () => void;
  onSave: (customer: any) => void;
};

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  show,
  onClose,
  onSave,
}) => {
  // Customer info
  const [company, setCompany] = useState("");
  const [customerSource, setCustomerSource] = useState("");
  // Default main contact
  const [mainContact, setMainContact] = useState<Contact>({
    firstName: "",
    lastName: "",
    title: "",
    contactType: "Mobile",
    contactValue: "",
  });
  // Physical Address
  const [address, setAddress] = useState<Address>({
    address: "",
    room: "",
    city: "",
    suburb: "",
    postcode: "",
    state: "",
    country: "",
  });
  // Settings
  const [settings, setSettings] = useState<CustomerSettings>({
    pricingTier: pricingTiers[0],
    paymentTerms: paymentTerms[0],
    cardPaymentFee: cardPaymentFees[0],
    chargeOutRate: "",
    materialDiscount: "",
    labourDiscount: "",
    customTaxRate: "",
    disableInvoiceReminders: "No",
    attachInvoicePdf: false,
    disableQuoteReminders: "No",
  });
  // Diğer ek kontaklar
  const [otherContacts, setOtherContacts] = useState<Contact[]>([]);
  // Billing/Postal Adres için checkbox
  const [sameAsMainContact, setSameAsMainContact] = useState(true);
  const [sameAsPhysicalAddress, setSameAsPhysicalAddress] = useState(true);

  // Contact add/remove
  const addContact = () =>
    setOtherContacts((prev) => [
      ...prev,
      { firstName: "", lastName: "", title: "", contactType: "Mobile", contactValue: "" },
    ]);
  const removeContact = (idx: number) =>
    setOtherContacts((prev) => prev.filter((_, i) => i !== idx));

  // Submit işlemi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    onSave({
      company,
      customerSource,
      mainContact,
      address,
      otherContacts,
      settings,
      sameAsMainContact,
      sameAsPhysicalAddress,
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <span>Customer Details</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {/* COMPANY */}
          <label>
            Customer/Company name <b>*</b>
            <input value={company} onChange={e => setCompany(e.target.value)} required />
          </label>
          <label>
            Customer source
            <select value={customerSource} onChange={e => setCustomerSource(e.target.value)}>
              <option value="">Select...</option>
              <option value="web">Web</option>
              <option value="referral">Referral</option>
              {/* diğer seçenekler */}
            </select>
          </label>
          <hr />
          {/* MAIN CONTACT */}
          <div className={styles.sectionTitle}>Default main contact</div>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>
              First name <b>*</b>
              <input
                value={mainContact.firstName}
                required
                onChange={e => setMainContact({ ...mainContact, firstName: e.target.value })}
              />
            </label>
            <label style={{ flex: 1, marginLeft: 10 }}>
              Last name
              <input
                value={mainContact.lastName}
                onChange={e => setMainContact({ ...mainContact, lastName: e.target.value })}
              />
            </label>
          </div>
          <label>
            Title/Position
            <input
              value={mainContact.title}
              onChange={e => setMainContact({ ...mainContact, title: e.target.value })}
            />
          </label>
          <div className={styles.flexRow}>
            <label>
              Contact type
              <select
                value={mainContact.contactType}
                onChange={e => setMainContact({ ...mainContact, contactType: e.target.value })}
              >
                {contactTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <input
              placeholder="Enter phone/email"
              value={mainContact.contactValue}
              onChange={e => setMainContact({ ...mainContact, contactValue: e.target.value })}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
          <hr />
          {/* PHYSICAL ADDRESS */}
          <div className={styles.sectionTitle}>Physical Address</div>
          <label>Address <input value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })} /></label>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>Room/Apartment/Building <input value={address.room} onChange={e => setAddress({ ...address, room: e.target.value })} /></label>
            <label style={{ flex: 1, marginLeft: 10 }}>City <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} /></label>
          </div>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>Suburb <input value={address.suburb} onChange={e => setAddress({ ...address, suburb: e.target.value })} /></label>
            <label style={{ flex: 1, marginLeft: 10 }}>Postcode <input value={address.postcode} onChange={e => setAddress({ ...address, postcode: e.target.value })} /></label>
          </div>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>State <input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} /></label>
            <label style={{ flex: 1, marginLeft: 10 }}>Country <input value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} /></label>
          </div>
          {/* CHECKBOXES */}
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={sameAsMainContact}
              onChange={e => setSameAsMainContact(e.target.checked)}
              id="sameMain"
            />
            <label htmlFor="sameMain" className={styles.checkboxLabel}>Same as main contact</label>
            <input
              type="checkbox"
              checked={sameAsPhysicalAddress}
              onChange={e => setSameAsPhysicalAddress(e.target.checked)}
              id="samePhysical"
              style={{ marginLeft: 20 }}
            />
            <label htmlFor="samePhysical" className={styles.checkboxLabel}>Same as physical address</label>
          </div>
          <hr />
          {/* OTHER CONTACTS */}
          <div className={styles.sectionTitle}>Other contacts</div>
          {otherContacts.map((c, idx) => (
            <div key={idx} className={styles.otherContactBox}>
              <div className={styles.flexRow}>
                <input
                  placeholder="First name"
                  value={c.firstName}
                  onChange={e => {
                    const list = [...otherContacts];
                    list[idx].firstName = e.target.value;
                    setOtherContacts(list);
                  }}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="Last name"
                  value={c.lastName}
                  onChange={e => {
                    const list = [...otherContacts];
                    list[idx].lastName = e.target.value;
                    setOtherContacts(list);
                  }}
                  style={{ flex: 1, marginLeft: 10 }}
                />
                <button type="button" onClick={() => removeContact(idx)} className={styles.deleteBtn}>×</button>
              </div>
              <input
                placeholder="Title/Position"
                value={c.title}
                onChange={e => {
                  const list = [...otherContacts];
                  list[idx].title = e.target.value;
                  setOtherContacts(list);
                }}
              />
              <div className={styles.flexRow}>
                <select
                  value={c.contactType}
                  onChange={e => {
                    const list = [...otherContacts];
                    list[idx].contactType = e.target.value;
                    setOtherContacts(list);
                  }}
                >
                  {contactTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <input
                  placeholder="Enter phone/email"
                  value={c.contactValue}
                  onChange={e => {
                    const list = [...otherContacts];
                    list[idx].contactValue = e.target.value;
                    setOtherContacts(list);
                  }}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </div>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addContact}>+ Add Another Contact</button>
          <hr />
          {/* CUSTOMER SETTINGS */}
          <div className={styles.sectionTitle}>Customer Settings</div>
          <label>Pricing Tier
            <select value={settings.pricingTier} onChange={e => setSettings({ ...settings, pricingTier: e.target.value })}>
              {pricingTiers.map(tier => <option key={tier} value={tier}>{tier}</option>)}
            </select>
          </label>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>
              Payment terms
              <select value={settings.paymentTerms} onChange={e => setSettings({ ...settings, paymentTerms: e.target.value })}>
                {paymentTerms.map(term => <option key={term} value={term}>{term}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, marginLeft: 10 }}>
              Card Payment Fee
              <select value={settings.cardPaymentFee} onChange={e => setSettings({ ...settings, cardPaymentFee: e.target.value })}>
                {cardPaymentFees.map(fee => <option key={fee} value={fee}>{fee}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>
              Charge out rate
              <input type="number" value={settings.chargeOutRate} onChange={e => setSettings({ ...settings, chargeOutRate: e.target.value })} />
            </label>
            <label style={{ flex: 1, marginLeft: 10 }}>
              Material Discount (%)
              <input type="number" value={settings.materialDiscount} onChange={e => setSettings({ ...settings, materialDiscount: e.target.value })} />
            </label>
          </div>
          <div className={styles.flexRow}>
            <label style={{ flex: 1 }}>
              Labour Discount (%)
              <input type="number" value={settings.labourDiscount} onChange={e => setSettings({ ...settings, labourDiscount: e.target.value })} />
            </label>
            <label style={{ flex: 1, marginLeft: 10 }}>
              Custom Tax Rate (%)
              <input type="number" value={settings.customTaxRate} onChange={e => setSettings({ ...settings, customTaxRate: e.target.value })} />
            </label>
          </div>
          <label>
            Disable Invoice Reminders
            <select value={settings.disableInvoiceReminders} onChange={e => setSettings({ ...settings, disableInvoiceReminders: e.target.value })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
          <div className={styles.flexRow}>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={settings.attachInvoicePdf}
                onChange={e => setSettings({ ...settings, attachInvoicePdf: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Attach Invoice PDF
            </label>
          </div>
          <label>
            Disable Quote Reminders
            <select value={settings.disableQuoteReminders} onChange={e => setSettings({ ...settings, disableQuoteReminders: e.target.value })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.saveBtn}>Save</button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerModal;
