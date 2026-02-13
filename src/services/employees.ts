import { apiGet, apiPost } from "./api";

export type Employee = {
  id: number;
  name: string;
  rate: number;
};
export async function fetchEmployees(): Promise<Employee[]> {
  const data = await apiGet<Employee[]>("/employees");
  return data ?? [];
}

export async function createEmployee(data: {
  name: string;
  rate: number;
}) {
  return apiPost("/employees", data);
}