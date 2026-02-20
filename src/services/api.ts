const API_BASE =
  process.env.REACT_APP_API_BASE ||
  "http://localhost:3001/api";


let impersonateCompanyMemory: number | null =
  Number(localStorage.getItem("impersonateCompany")) || null;



/* =========================================================
CORE REQUEST (GENERIC)
========================================================= */

async function request<T = any>(
  path: string,
  options?: RequestInit
): Promise<T | null>
{

  const token =
    localStorage.getItem("token");


  const res =
    await fetch(
      `${API_BASE}${path}`,
      {
        ...options,

        headers: {

          "Content-Type":
            "application/json",

          ...(token && {
            Authorization:
              `Bearer ${token}`
          }),

          ...(impersonateCompanyMemory && {
            "X-Company-Id":
              impersonateCompanyMemory.toString()
          }),

          ...(options?.headers || {})
        }
      }
    );


  if (!res.ok)
  {

    const text =
      await res.text();

    throw new Error(text);

  }


  const text =
    await res.text();

  if (!text)
    return null;

  return JSON.parse(text);

}



/* =========================================================
GENERIC EXPORTS
========================================================= */

export const apiGet =
<T = any>(path: string) =>
request<T>(path);


export const apiPost =
<T = any>(path: string, body: any) =>
request<T>(
  path,
  {
    method: "POST",
    body: JSON.stringify(body)
  }
);


export const apiPut =
<T = any>(path: string, body: any) =>
request<T>(
  path,
  {
    method: "PUT",
    body: JSON.stringify(body)
  }
);


export const apiDelete =
<T = any>(path: string) =>
request<T>(
  path,
  {
    method: "DELETE"
  }
);



/* =========================================================
IMPERSONATION
========================================================= */

export function setImpersonationCompany(
  id: number | null
)
{

  impersonateCompanyMemory = id;

  if (id === null)
    localStorage.removeItem("impersonateCompany");
  else
    localStorage.setItem("impersonateCompany", String(id));

}



/* =========================================================
LOGOUT
========================================================= */

export function logout()
{

  localStorage.clear();

  window.location.href =
    "/login";

}


/* =========================================================
REGISTER
========================================================= */

export async function register(data: {
  email: string;
  password: string;
  company_name?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Registration failed");
  }

  const result = await res.json();
  
  // Save token to localStorage
  if (result.token) {
    localStorage.setItem("token", result.token);
  }
  
  // Save user data to localStorage
  if (result.user) {
    localStorage.setItem("user", JSON.stringify(result.user));
  }

  return result;
}


export default {

  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete

};