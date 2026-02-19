// src/services/api.ts
// Honeycomb API Service (FULLY FIXED)

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3001/api";

/* =========================================================
   CORE REQUEST FUNCTION
========================================================= */

async function request<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {

  const token = localStorage.getItem("token");

  // ✅ correct key (FIXED)
const impersonateCompanyRaw =
  localStorage.getItem("impersonateCompany");

const impersonateCompany =
  impersonateCompanyRaw &&
  impersonateCompanyRaw !== ""
    ? impersonateCompanyRaw
    : null;

  const url = `${API_BASE}${path}`;

  try {

    const res = await fetch(url, {

      ...options,

      headers: {

        "Content-Type": "application/json",

        // ✅ AUTH TOKEN
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),

        // ✅ COMPANY IMPERSONATION
        ...(impersonateCompany
          ? { "X-Company-Id": impersonateCompany }
          : {}),

        ...(options?.headers || {}),

      },

    });

    /* ================= HANDLE HTTP ERROR ================= */

    if (!res.ok) {

      let body: any = null;

      try {

        const text = await res.text();

        body = text
          ? JSON.parse(text)
          : text;

      } catch {

        body = null;

      }

      console.error("API ERROR:", {
        url,
        status: res.status,
        body,
      });

      throw new Error(
        JSON.stringify(
          {
            url,
            status: res.status,
            body,
          },
          null,
          2
        )
      );

    }

    /* ================= SAFE RESPONSE PARSE ================= */

    const text = await res.text();

    if (!text)
      return null;

    try {

      return JSON.parse(text) as T;

    } catch {

      return text as unknown as T;

    }

  }
  catch (error: any) {

    console.error("NETWORK ERROR:", error);

    throw error;

  }

}

/* =========================================================
   API HELPERS
========================================================= */

export const apiGet = <T>(path: string) =>
  request<T>(path);

export const apiPost = <T>(path: string, body: any) =>
  request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPut = <T>(path: string, body: any) =>
  request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const apiDelete = (path: string) =>
  request<null>(path, {
    method: "DELETE",
  });

/* =========================================================
   IMPERSONATION
========================================================= */

export const setImpersonationCompany = (companyId: number | null) => {

  if (!companyId)
    localStorage.removeItem("impersonateCompany");

  else
    localStorage.setItem(
      "impersonateCompany",
      String(companyId)
    );

  window.location.reload();

};


export const getImpersonationCompany =
  () =>
    localStorage.getItem(
      "impersonateCompany"
    );

/* =========================================================
   AUTH HELPERS
========================================================= */

export const logout = () => {

  localStorage.removeItem("token");

  localStorage.removeItem(
    "impersonateCompany"
  );

  window.location.href =
    "/login";

};
