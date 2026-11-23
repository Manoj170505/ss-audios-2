/**
 * API Configuration & Utilities for SS Audios (Erode, Tamil Nadu)
 * Connects directly to the hosted Render backend:
 * https://ss-audios-backend.onrender.com
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || 'https://ss-audios-backend.onrender.com'
).replace(/\/$/, '');

/**
 * Returns a fully qualified API URL.
 * If endpoint is already absolute (starts with http/https), returns as is.
 *
 * Example: apiUrl('/api/site-data') -> "https://ss-audios-backend.onrender.com/api/site-data"
 */
export function apiUrl(endpoint: string): string {
  if (!endpoint) return '';
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * Resolves a media/video URL to ensure relative backend paths like:
 * "/api/media/slot-01/video.mp4" point to the Render backend host.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/api/')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}
