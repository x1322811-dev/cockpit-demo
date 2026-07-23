const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export function apiUrl(path: `/${string}`): string {
  return `${apiBaseUrl}${path}`;
}
