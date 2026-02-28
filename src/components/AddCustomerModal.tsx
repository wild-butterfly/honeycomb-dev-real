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
  const [mainSecondaryContactType, setMainSecondaryContactType] =
    useState("Email");
  const [mainContactEmail, setMainContactEmail] = useState("");
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
      mainSecondaryContactType,
      mainContactEmail,
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
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <span>Add Customer</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.body}>
          <div className={styles.columns}>
            <div className={styles.column}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>Customer Details</div>
                <div className={styles.sectionBody}>
                  <label>
                    Customer/Company name <b>*</b>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Customer source
                    <select
                      value={customerSource}
                      onChange={(e) => setCustomerSource(e.target.value)}
                    >
                      <option value="">No Customer Source</option>
                      <option value="web">Web</option>
                      <option value="referral">Referral</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>Physical Address</div>
                <div className={styles.sectionBody}>
                  <label>
                    Address
                    <input
                      value={address.address}
                      onChange={(e) =>
                        setAddress({ ...address, address: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Room/Apartment/Building
                    <input
                      value={address.room}
                      onChange={(e) =>
                        setAddress({ ...address, room: e.target.value })
                      }
                    />
                  </label>
                  <div className={styles.gridTwo}>
                    <label>
                      Suburb
                      <input
                        value={address.suburb}
                        onChange={(e) =>
                          setAddress({ ...address, suburb: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Postcode
                      <input
                        value={address.postcode}
                        onChange={(e) =>
                          setAddress({ ...address, postcode: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className={styles.gridTwo}>
                    <label>
                      State / Region
                      <input
                        value={address.state}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Country
                      <input
                        value={address.country}
                        onChange={(e) =>
                          setAddress({ ...address, country: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    City
                    <input
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>Postal Address</div>
                <div className={styles.sectionBody}>
                  <div className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={sameAsPhysicalAddress}
                      onChange={(e) => setSameAsPhysicalAddress(e.target.checked)}
                      id="samePhysical"
                    />
                    <label htmlFor="samePhysical" className={styles.checkboxLabel}>
                      Same as physical address
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div className={styles.column}>
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>Contacts</div>
                <div className={styles.sectionBody}>
                  <div className={styles.subTitle}>Default Main Contact</div>
                  <div className={styles.gridTwo}>
                    <label>
                      First Name <b>*</b>
                      <input
                        value={mainContact.firstName}
                        required
                        onChange={(e) =>
                          setMainContact({
                            ...mainContact,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Last Name
                      <input
                        value={mainContact.lastName}
                        onChange={(e) =>
                          setMainContact({ ...mainContact, lastName: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Title/Position
                    <input
                      value={mainContact.title}
                      onChange={(e) =>
                        setMainContact({ ...mainContact, title: e.target.value })
                      }
                    />
                  </label>
                  <div className={styles.contactRow}>
                    <select
                      value={mainContact.contactType}
                      onChange={(e) =>
                        setMainContact({
                          ...mainContact,
                          contactType: e.target.value,
                        })
                      }
                    >
                      {contactTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Enter phone/email"
                      value={mainContact.contactValue}
                      onChange={(e) =>
                        setMainContact({
                          ...mainContact,
                          contactValue: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className={styles.contactRow}>
                    <select
                      value={mainSecondaryContactType}
                      onChange={(e) => setMainSecondaryContactType(e.target.value)}
                      aria-label="Secondary contact type"
                    >
                      {contactTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      type={
                        mainSecondaryContactType === "Email" ? "email" : "text"
                      }
                      placeholder={`Enter ${mainSecondaryContactType.toLowerCase()}`}
                      value={mainContactEmail}
                      onChange={(e) => setMainContactEmail(e.target.value)}
                    />
                  </div>

                  <div className={styles.subCardRow}>
                    <div className={styles.subTitle}>Billing Contact</div>
                    <div className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={sameAsMainContact}
                        onChange={(e) => setSameAsMainContact(e.target.checked)}
                        id="sameMain"
                      />
                      <label htmlFor="sameMain" className={styles.checkboxLabel}>
                        Same as main contact
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={addContact}
                  >
                    + Add Contact
                  </button>

                  {otherContacts.map((c, idx) => (
                    <div key={idx} className={styles.otherContactBox}>
                      <div className={styles.gridTwo}>
                        <input
                          placeholder="First name"
                          value={c.firstName}
                          onChange={(e) => {
                            const list = [...otherContacts];
                            list[idx].firstName = e.target.value;
                            setOtherContacts(list);
                          }}
                        />
                        <input
                          placeholder="Last name"
                          value={c.lastName}
                          onChange={(e) => {
                            const list = [...otherContacts];
                            list[idx].lastName = e.target.value;
                            setOtherContacts(list);
                          }}
                        />
                      </div>
                      <input
                        placeholder="Title/Position"
                        value={c.title}
                        onChange={(e) => {
                          const list = [...otherContacts];
                          list[idx].title = e.target.value;
                          setOtherContacts(list);
                        }}
                      />
                      <div className={styles.contactRow}>
                        <select
                          value={c.contactType}
                          onChange={(e) => {
                            const list = [...otherContacts];
                            list[idx].contactType = e.target.value;
                            setOtherContacts(list);
                          }}
                        >
                          {contactTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="Enter phone/email"
                          value={c.contactValue}
                          onChange={(e) => {
                            const list = [...otherContacts];
                            list[idx].contactValue = e.target.value;
                            setOtherContacts(list);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className={styles.deleteBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>Customer Settings</div>
                <div className={styles.sectionBody}>
                  <label>
                    Pricing Tier
                    <select
                      value={settings.pricingTier}
                      onChange={(e) =>
                        setSettings({ ...settings, pricingTier: e.target.value })
                      }
                    >
                      {pricingTiers.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.gridTwo}>
                    <label>
                      Payment terms
                      <select
                        value={settings.paymentTerms}
                        onChange={(e) =>
                          setSettings({ ...settings, paymentTerms: e.target.value })
                        }
                      >
                        {paymentTerms.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Card Payment Fee
                      <select
                        value={settings.cardPaymentFee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            cardPaymentFee: e.target.value,
                          })
                        }
                      >
                        {cardPaymentFees.map((fee) => (
                          <option key={fee} value={fee}>
                            {fee}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn}>
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerModal;
