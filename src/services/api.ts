// src/services/api.ts
const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:3001/api";

async function request<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  // ❌ HTTP error
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

  // ✅ 204 No Content / empty body SAFE
  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // backend text/plain dönerse
    return text as unknown as T;
  }
}

/* ================= PUBLIC HELPERS ================= */

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