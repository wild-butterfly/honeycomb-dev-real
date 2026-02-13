// src/services/api.ts
// Honeycomb API Service (Impersonation enabled)

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

  // 🔥 NEW: superadmin company switch
  const impersonateCompany = localStorage.getItem("impersonateCompany");

  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",

        // auth
        ...(token ? { Authorization: `Bearer ${token}` } : {}),

        // 🔥 NEW — company override header
        ...(impersonateCompany
          ? { "X-Company-Id": impersonateCompany }
          : {}),

        ...(options?.headers || {}),
      },

      ...options,
    });

    /* ================= HTTP ERROR ================= */

    if (!res.ok) {
      let body: any = null;

      try {
        const text = await res.text();
        body = text ? JSON.parse(text) : text;
      } catch {
        body = null;
      }

      console.error("API error", {
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
          2,
        ),
      );
    }

    /* ================= SAFE BODY PARSE ================= */

    const text = await res.text();

    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }

  } catch (error: any) {

    console.error("Network error:", error);

    throw new Error(
      JSON.stringify(
        {
          url,
          message: "Server unreachable",
        },
        null,
        2,
      ),
    );
  }
}

/* =========================================================
   PUBLIC HELPERS
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
   IMPERSONATION HELPERS
========================================================= */

// 🔥 NEW helpers for easy switching

export const setImpersonationCompany = (companyId: number | null) => {
  if (companyId === null) {
    localStorage.removeItem("impersonateCompany");
  } else {
    localStorage.setItem("impersonateCompany", String(companyId));
  }

  window.location.reload();
};

export const getImpersonationCompany = () =>
  localStorage.getItem("impersonateCompany");

/* =========================================================
   LOGOUT
========================================================= */

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("impersonateCompany"); // 🔥 clear switch
  window.location.href = "/login";
};