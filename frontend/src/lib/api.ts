export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  idToken?: string
): Promise<T> {
  const resolveBaseUrl = () => {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim();
    const browserOrigin = typeof window !== "undefined" ? window.location.origin : "";

    if (!configuredBaseUrl) {
      if (browserOrigin) {
        return browserOrigin;
      }
      throw new Error("Missing NEXT_PUBLIC_BACKEND_BASE_URL");
    }

    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      configuredBaseUrl.startsWith("http://")
    ) {
      return configuredBaseUrl.replace(/^http:\/\//i, "https://");
    }

    return configuredBaseUrl;
  };

  const baseUrl = resolveBaseUrl();
  const hasJsonBody = options.body !== undefined && !(options.body instanceof FormData);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (hasJsonBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;

  const requestUrl = `${normalizedBaseUrl}${normalizedPath}`;

  const makeRequest = () =>
    fetch(requestUrl, {
      ...options,
      headers,
    });

  let response: Response;
  try {
    response = await makeRequest();
  } catch (error) {
    const isNetworkError = error instanceof TypeError;
    if (isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      response = await makeRequest();
    } else {
      throw error;
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
