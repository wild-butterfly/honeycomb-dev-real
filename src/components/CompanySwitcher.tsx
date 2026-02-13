import { useEffect, useState } from "react";
import { setImpersonationCompany } from "../services/api";
import styles from "./CompanySwitcher.module.css";

export default function CompanySwitcher() {
  const [user, setUser] = useState<any>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser(payload);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("impersonationCompany");
    if (saved) setSelected(saved);
  }, []);

  if (!user || user.role !== "superadmin") return null;

  return (
    <div className={styles.wrapper}>
      <select
        className={styles.select}
        value={selected}
        onChange={(e) => {
          const val = e.target.value;

          setSelected(val);
          localStorage.setItem("impersonationCompany", val);

          setImpersonationCompany(val ? Number(val) : null);
        }}
      >
        <option value="">🌍 God Mode</option>
        <option value="1">A1</option>
      </select>
    </div>
  );
}
