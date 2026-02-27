import { apiGet, apiPost, apiPut, apiDelete } from "./api";

export type Employee = {
  id: number;
  name: string;
  role: string | null;
  rate: number;
  active: boolean;
};

export async function fetchEmployees(): Promise<Employee[]> {
  const data = await apiGet<Employee[]>("/employees");
  return data ?? [];
}

export async function createEmployee(data: {
  name: string;
  role?: string | null;
  rate: number;
}): Promise<Employee | null> {
  return apiPost<Employee>("/employees", data);
}

export async function updateEmployee(
  id: number,
  data: Partial<{ name: string; role: string | null; rate: number; active: boolean }>
): Promise<Employee | null> {
  return apiPut<Employee>(`/employees/${id}`, data);
}

export async function deleteEmployee(id: number): Promise<void> {
  await apiDelete(`/employees/${id}`);
}
