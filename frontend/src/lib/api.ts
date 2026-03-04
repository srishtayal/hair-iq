export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  idToken?: string
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_BASE_URL");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
