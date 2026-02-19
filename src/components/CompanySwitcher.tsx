import styles from "./CompanySwitcher.module.css";

import { useCompany } from "../context/CompanyContext";

export default function CompanySwitcher() {
  const {
    companyId,

    setCompanyId,

    companies,
  } = useCompany();

  const handleSwitch = (val: string) => {
    const id = val === "" ? null : Number(val);

    setCompanyId(id);

    if (id === null) localStorage.removeItem("impersonateCompany");
    else localStorage.setItem("impersonateCompany", String(id));
  };

  return (
    <div className={styles.wrapper}>
      <select
        value={companyId ?? ""}
        onChange={(e) => handleSwitch(e.target.value)}
      >
        <option value="">🌍 God Mode</option>

        {companies.map((c: any) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
