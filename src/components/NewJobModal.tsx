import React, { useState } from "react";
import styles from "./NewJobModal.module.css";

type CustomerType = { id: number; name: string };

type Contact = {
  firstName: string;
  lastName: string;
  title: string;
  contactType: string;
  contactValue: string;
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

type NewJobModalProps = {
  show: boolean;
  onClose: () => void;
  onSubmit: (job: any) => void;
  customersList: CustomerType[];
  onAddCustomer: (customer: Omit<CustomerType, "id">) => void;
};

const initialContact: Contact = {
  firstName: "",
  lastName: "",
  title: "",
  contactType: "Mobile",
  contactValue: "",
};

const initialSettings: CustomerSettings = {
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
};

const NewJobModal: React.FC<NewJobModalProps> = ({
  show,
  onClose,
  onSubmit,
  customersList,
  onAddCustomer,
}) => {
  // Main job fields
  const [customerSearch, setCustomerSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [site, setSite] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerOrderNumber, setCustomerOrderNumber] = useState("");
  const [needsQuote, setNeedsQuote] = useState(false);

  // Add Customer modal controls
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Add Customer fields
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [mainContact, setMainContact] = useState<Contact>({
    ...initialContact,
  });
  const [address, setAddress] = useState("");
  const [room, setRoom] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [stateField, setStateField] = useState("");
  const [country, setCountry] = useState("");
  const [billingContactSame, setBillingContactSame] = useState(true);
  const [billingContact, setBillingContact] = useState<Contact>({
    ...initialContact,
  });
  const [postalSame, setPostalSame] = useState(true);
  const [postalAddress, setPostalAddress] = useState("");
  const [otherContacts, setOtherContacts] = useState<Contact[]>([]);
  const [settings, setSettings] = useState<CustomerSettings>({
    ...initialSettings,
  });

  // Customer autocomplete
  const filteredCustomers = customersList.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );
  const handleCustomerSelect = (name: string) => {
    setCustomer(name);
    setCustomerSearch(name);
  };

  // New Job form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !site || !title) return;
    onSubmit({
      customer,
      site,
      title,
      description,
      customerOrderNumber,
      needsQuote,
    });
    setCustomer("");
    setSite("");
    setTitle("");
    setDescription("");
    setCustomerOrderNumber("");
    setNeedsQuote(false);
    onClose();
  };

  // Save new customer (from add customer modal)
  const handleCustomerSave = () => {
    onAddCustomer({ name: company });
    setCustomer(company);
    setCustomerSearch(company);
    setShowAddCustomerModal(false);
    setCompany("");
    setSource("");
    setMainContact({ ...initialContact });
    setAddress("");
    setRoom("");
    setCity("");
    setSuburb("");
    setPostcode("");
    setStateField("");
    setCountry("");
    setBillingContactSame(true);
    setBillingContact({ ...initialContact });
    setPostalSame(true);
    setPostalAddress("");
    setOtherContacts([]);
    setSettings({ ...initialSettings });
  };

  if (!show) return null;

  return (
    <div className={styles.newJobPanelOverlay} onClick={onClose}>
      <form
        className={styles.newJobPanel}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>New Job</span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.panelBody}>
          <label>
            <span className={styles.label}>
              Customer <b>*</b>
            </span>
            <div className={styles.inputWithButton}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  className={styles.input}
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomer("");
                  }}
                  placeholder="Search customer or company"
                  autoComplete="off"
                />
                {customerSearch &&
                  !customer &&
                  filteredCustomers.length > 0 && (
                    <div className={styles.autocompleteList}>
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          className={styles.autocompleteItem}
                          onClick={() => handleCustomerSelect(c.name)}
                        >
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              <button
                type="button"
                className={styles.addCustomerBtn}
                onClick={() => setShowAddCustomerModal(true)}
              >
                <span className={styles.plusIcon}>＋</span> Add New Customer
              </button>
            </div>
          </label>
          <label>
            <span className={styles.label}>
              Site <b>*</b>
            </span>
            <div className={styles.inputWithButton}>
              <input
                className={styles.input}
                required
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Enter site address"
              />
              <div className={styles.siteActions}>
                <button
                  type="button"
                  className={styles.sameAsCustomerBtn}
                  onClick={() => setSite(customer || customerSearch)}
                >
                  <span className={styles.plusIcon}>↻</span> Same as Customer
                </button>
                <button type="button" className={styles.addSiteBtn}>
                  <span className={styles.plusIcon}>＋</span> Add New Site
                </button>
              </div>
            </div>
          </label>
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={needsQuote}
              onChange={(e) => setNeedsQuote(e.target.checked)}
              id="needsQuote"
            />
            <label
              htmlFor="needsQuote"
              style={{ marginBottom: 0, fontWeight: 600 }}
            >
              This job needs a Quote or an Estimate
            </label>
          </div>
          <label>
            <span className={styles.label}>
              Job title <b>*</b>
            </span>
            <input
              className={styles.input}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter job title"
            />
          </label>
          <label>
            <span className={styles.label}>Job description (Optional)</span>
            <textarea
              className={styles.inputArea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter job description"
              rows={3}
            />
          </label>
          <label>
            <span className={styles.label}>Customer order number (Optional)</span>
            <input
              className={styles.input}
              value={customerOrderNumber}
              onChange={(e) => setCustomerOrderNumber(e.target.value)}
              placeholder="Enter customer order number"
            />
          </label>
        </div>
        <div className={styles.panelFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.createBtn}>
            Create Job
          </button>
        </div>

        {/* --- ADD CUSTOMER MODAL --- */}
        {showAddCustomerModal && (
          <div
            className={styles.addCustomerModalOverlay}
            onClick={() => setShowAddCustomerModal(false)}
          >
            <div
              className={styles.addCustomerModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Add New Customer</span>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowAddCustomerModal(false)}
                >
                  ×
                </button>
              </div>
              <div
                className={styles.panelBody}
                style={{ maxHeight: "77vh", overflowY: "auto" }}
              >
                <h3 className={styles.formSectionTitle}>Customer Details</h3>
                <div className={styles.formSection}>
                  <label>
                    <span className={styles.label}>
                      Customer/Company name <b>*</b>
                    </span>
                    <input
                      className={styles.input}
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter company or customer name"
                    />
                  </label>
                  <label>
                    <span className={styles.label}>Customer source</span>
                    <select
                      className={styles.input}
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option>Referral</option>
                      <option>Website</option>
                      <option>Phone Inquiry</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>
                <h3 className={styles.formSectionTitle}>
                  Default main contact
                </h3>
                <div className={styles.inputRow}>
                  <label style={{ flex: 1 }}>
                    <span className={styles.label}>
                      First name <b>*</b>
                    </span>
                    <input
                      className={styles.input}
                      required
                      value={mainContact.firstName}
                      onChange={(e) =>
                        setMainContact((c) => ({
                          ...c,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="Enter first name"
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    <span className={styles.label}>Last name</span>
                    <input
                      className={styles.input}
                      value={mainContact.lastName}
                      onChange={(e) =>
                        setMainContact((c) => ({
                          ...c,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder="Enter last name"
                    />
                  </label>
                </div>
                <div className={styles.formSection}>
                  <label>
                    <span className={styles.label}>Title/Position</span>
                    <input
                      className={styles.input}
                      value={mainContact.title}
                      onChange={(e) =>
                        setMainContact((c) => ({ ...c, title: e.target.value }))
                      }
                      placeholder="Enter title"
                    />
                  </label>
                  <label>
                    <span className={styles.label}>Contact type</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className={styles.input}
                        style={{ width: 110 }}
                        value={mainContact.contactType}
                        onChange={(e) =>
                          setMainContact((c) => ({
                            ...c,
                            contactType: e.target.value,
                          }))
                        }
                      >
                        {contactTypes.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        className={styles.input}
                        value={mainContact.contactValue}
                        onChange={(e) =>
                          setMainContact((c) => ({
                            ...c,
                            contactValue: e.target.value,
                          }))
                        }
                        placeholder="Enter phone/email"
                      />
                    </div>
                  </label>
                </div>
                <h3 className={styles.formSectionTitle}>Physical Address</h3>
                <div className={styles.formSection}>
                  <label>
                    <span className={styles.label}>Address</span>
                    <input
                      className={styles.input}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter address"
                    />
                  </label>
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="Room/Apartment/Building"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                    />
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="Suburb"
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                    />
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="Postcode"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="State"
                      value={stateField}
                      onChange={(e) => setStateField(e.target.value)}
                    />
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
                <h3 className={styles.formSectionTitle}>Billing Contact</h3>
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={billingContactSame}
                    onChange={(e) => setBillingContactSame(e.target.checked)}
                    id="billingContactSame"
                  />
                  <label
                    htmlFor="billingContactSame"
                    style={{ marginBottom: 0, fontWeight: 600 }}
                  >
                    Same as main contact
                  </label>
                </div>
                {!billingContactSame && (
                  <div className={styles.inputRow}>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>
                        Billing contact first name
                      </span>
                      <input
                        className={styles.input}
                        value={billingContact.firstName}
                        onChange={(e) =>
                          setBillingContact((c) => ({
                            ...c,
                            firstName: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>
                        Billing contact last name
                      </span>
                      <input
                        className={styles.input}
                        value={billingContact.lastName}
                        onChange={(e) =>
                          setBillingContact((c) => ({
                            ...c,
                            lastName: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                )}
                <h3 className={styles.formSectionTitle}>Postal Address</h3>
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={postalSame}
                    onChange={(e) => setPostalSame(e.target.checked)}
                    id="postalSame"
                  />
                  <label
                    htmlFor="postalSame"
                    style={{ marginBottom: 0, fontWeight: 600 }}
                  >
                    Same as physical address
                  </label>
                </div>
                {!postalSame && (
                  <div className={styles.formSection}>
                    <label>
                      <span className={styles.label}>Postal address</span>
                      <input
                        className={styles.input}
                        value={postalAddress}
                        onChange={(e) => setPostalAddress(e.target.value)}
                        placeholder="Enter postal address"
                      />
                    </label>
                  </div>
                )}
                <h3 className={styles.formSectionTitle}>Other contacts</h3>
                {otherContacts.map((c, i) => (
                  <div className={styles.inputRow} key={i}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="First name"
                      value={c.firstName}
                      onChange={(e) => {
                        const arr = [...otherContacts];
                        arr[i].firstName = e.target.value;
                        setOtherContacts(arr);
                      }}
                    />
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      placeholder="Last name"
                      value={c.lastName}
                      onChange={(e) => {
                        const arr = [...otherContacts];
                        arr[i].lastName = e.target.value;
                        setOtherContacts(arr);
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.addAnotherContactBtn}
                  onClick={() =>
                    setOtherContacts([...otherContacts, { ...initialContact }])
                  }
                >
                  + Add Another Contact
                </button>
                <h3 className={styles.formSectionTitle}>Customer Settings</h3>
                <div className={styles.formSection}>
                  <label>
                    <span className={styles.label}>Pricing Tier</span>
                    <select
                      className={styles.input}
                      value={settings.pricingTier}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          pricingTier: e.target.value,
                        }))
                      }
                    >
                      {pricingTiers.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.inputRow}>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Payment terms</span>
                      <select
                        className={styles.input}
                        value={settings.paymentTerms}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            paymentTerms: e.target.value,
                          }))
                        }
                      >
                        {paymentTerms.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Card Payment Fee</span>
                      <select
                        className={styles.input}
                        value={settings.cardPaymentFee}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            cardPaymentFee: e.target.value,
                          }))
                        }
                      >
                        {cardPaymentFees.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className={styles.inputRow}>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Charge out rate</span>
                      <input
                        className={styles.input}
                        value={settings.chargeOutRate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            chargeOutRate: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Material Discount</span>
                      <input
                        className={styles.input}
                        value={settings.materialDiscount}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            materialDiscount: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <div className={styles.inputRow}>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Labour Discount</span>
                      <input
                        className={styles.input}
                        value={settings.labourDiscount}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            labourDiscount: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={{ flex: 1 }}>
                      <span className={styles.label}>Custom Tax Rate</span>
                      <input
                        className={styles.input}
                        value={settings.customTaxRate}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            customTaxRate: e.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label>
                    <span className={styles.label}>
                      Disable Invoice Reminders
                    </span>
                    <select
                      className={styles.input}
                      value={settings.disableInvoiceReminders}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          disableInvoiceReminders: e.target.value,
                        }))
                      }
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </label>
                  <div className={styles.inlineCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={settings.attachInvoicePdf}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          attachInvoicePdf: e.target.checked,
                        }))
                      }
                      id="attachInvoicePdf"
                    />
                    <label
                      htmlFor="attachInvoicePdf"
                      style={{ marginBottom: 0, fontWeight: 600 }}
                    >
                      Attach Invoice PDF
                    </label>
                  </div>
                  <label>
                    <span className={styles.label}>
                      Disable Quote Reminders
                    </span>
                    <select
                      className={styles.input}
                      value={settings.disableQuoteReminders}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          disableQuoteReminders: e.target.value,
                        }))
                      }
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </label>
                </div>
                <div className={styles.panelFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowAddCustomerModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.createBtn}
                    onClick={handleCustomerSave}
                    disabled={!company || !mainContact.firstName}
                  >
                    Save Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default NewJobModal;
