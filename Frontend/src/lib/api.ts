const VPS_IP = "144.91.89.100";

const isProduction = import.meta.env.PROD;
const BASE_URL = isProduction ? "/api-proxy" : `http://${VPS_IP}`;

const ANALYTICS_URL = BASE_URL;
const USER_MGMT_URL = `${BASE_URL}/api/v1`;
const AI_INSIGHTS_URL = BASE_URL;
const ALERTS_URL = BASE_URL;

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
  
  // Don't send Authorization header for auth routes
  const isAuthRoute = url.includes("/auth/login") || 
                     url.includes("/auth/signup") || 
                     url.includes("/auth/book-consultation");

  if (token && !isAuthRoute) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || response.statusText;
      } catch (e) {
        // Not a JSON error, maybe HTML from proxy
        console.error("Non-JSON error response:", response.status);
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
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
