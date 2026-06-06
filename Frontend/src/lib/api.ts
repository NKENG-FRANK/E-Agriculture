// Use relative paths for Vercel proxy to avoid Mixed Content errors (HTTPS -> HTTP)
const ANALYTICS_URL = "/api/analytics";
const USER_MGMT_URL = "/api/user-mgmt";
const AI_INSIGHTS_URL = "/api/insights";
const ALERTS_URL = "/api/alerts";

export const API_URLS = {
  ANALYTICS: ANALYTICS_URL,
  USER_MGMT: USER_MGMT_URL,
  AI_INSIGHTS: AI_INSIGHTS_URL,
  ALERTS: ALERTS_URL,
};

// Generic fetcher
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("sfms_token");
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || response.statusText);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (data: any) => 
      fetcher<any>(`${USER_MGMT_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    signup: (data: any) =>
      fetcher<any>(`${USER_MGMT_URL}/auth/signup`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    bookConsultation: (data: any) =>
      fetcher<any>(`${USER_MGMT_URL}/auth/book-consultation`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () =>
      fetcher<any>(`${USER_MGMT_URL}/auth/logout`, {
        method: "POST",
      }),
  },
  analytics: {
    getStats: (device?: string) =>
      fetcher<any>(`${ANALYTICS_URL}/analytics${device ? `?devices=${device}` : ""}`),
    getReadings: (limit = 100, device?: string) =>
      fetcher<any[]>(`${ANALYTICS_URL}/readings?limit=${limit}${device ? `&device=${device}` : ""}`),
    getDevices: () =>
      fetcher<string[]>(`${ANALYTICS_URL}/devices`),
  },
  ai: {
    getInsights: (farmId: string) =>
      fetcher<any>(`${AI_INSIGHTS_URL}/insights/${farmId}`),
  },
  alerts: {
    getHistory: () =>
      fetcher<any[]>(`${ALERTS_URL}/alerts/history`),
  },
};
