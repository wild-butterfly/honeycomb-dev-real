import React, { useState } from "react";
import styles from "./CustomerModal.module.css";

type Props = {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
};

const CustomerModal: React.FC<Props> = ({ show, onClose, onSubmit }) => {
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [contactType, setContactType] = useState("Mobile");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ company, source, firstName, lastName, title, contactType, phone, address });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <span>Customer Details</span>
          <button type="button" className={styles.close} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <label>Customer/Company name <b>*</b></label>
            <input className={styles.input} value={company} onChange={e => setCompany(e.target.value)} required placeholder="Enter company or customer name" />

            <label>Customer source</label>
            <select className={styles.input} value={source} onChange={e => setSource(e.target.value)}>
              <option value="">Select...</option>
              <option>Web</option>
              <option>Referral</option>
              <option>Phone</option>
            </select>
          </div>

          <hr />

          <div className={styles.section}>
            <b>Default main contact</b>
            <div className={styles.row}>
              <div>
                <label>First name <b>*</b></label>
                <input className={styles.input} value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Enter first name" />
              </div>
              <div>
                <label>Last name</label>
                <input className={styles.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter last name" />
              </div>
            </div>
            <label>Title/Position</label>
            <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title" />
            <div className={styles.row}>
              <label style={{ flex: 1 }}>
                Contact type
                <select className={styles.input} value={contactType} onChange={e => setContactType(e.target.value)}>
                  <option>Mobile</option>
                  <option>Phone</option>
                  <option>Email</option>
                </select>
              </label>
              <input className={styles.input} style={{ flex: 2, marginLeft: 10 }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" />
            </div>
          </div>

          <hr />

          <div className={styles.section}>
            <b>Physical Address</b>
            <label>Find address</label>
            <input className={styles.input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Search for address" />
            <button type="button" className={styles.linkBtn}>Add address manually</button>
          </div>

          <button type="button" className={styles.extraBtn}>
            + Add postal address, billing contact, other contacts, customer settings
          </button>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.saveBtn}>Save</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerModal;
