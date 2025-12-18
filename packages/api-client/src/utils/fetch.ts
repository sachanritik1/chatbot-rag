import type { AuthTokenProvider } from "../types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit & {
    getAuthToken: AuthTokenProvider;
  },
): Promise<T> {
  const { getAuthToken, ...fetchOptions } = options;

  // Get auth token
  const token = await getAuthToken();

  // Build headers
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: string }).error ??
      `HTTP error! status: ${response.status}`;
    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Return JSON
  return response.json() as Promise<T>;
}

export async function apiStreamingFetch(
  url: string,
  options: RequestInit & {
    getAuthToken: AuthTokenProvider;
  },
): Promise<Response> {
  const { getAuthToken, ...fetchOptions } = options;

  // Get auth token
  const token = await getAuthToken();

  // Build headers
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Check for errors but don't consume body (it's a stream)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: string }).error ??
      `HTTP error! status: ${response.status}`;
    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response;
}
