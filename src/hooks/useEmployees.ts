import { useEffect, useState } from "react";
import { fetchEmployees, Employee } from "../services/employees";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchEmployees();
      setEmployees(data);
      setLoading(false);
    }
    load();
  }, []);

  return { employees, loading };
}
