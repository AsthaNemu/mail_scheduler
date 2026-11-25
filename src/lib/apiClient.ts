import { ApiErrorResponse } from "@/types/api";

export class ApiClientError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;
  const baseUrl = getBaseUrl();

  let url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: HeadersInit = {
    Accept: "application/json",
    ...(restOptions.body ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...restOptions,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetails: unknown = undefined;

    try {
      const errorData = (await response.json()) as ApiErrorResponse;
      if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
      errorDetails = errorData?.details;
    } catch {
      // If response body isn't JSON, try reading text
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Fall back to status text
        if (response.statusText) errorMessage = response.statusText;
      }
    }

    throw new ApiClientError(response.status, errorMessage, errorDetails);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: "GET", params, ...options });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { method: "DELETE", ...options });
  },

  getBaseUrl,
};
