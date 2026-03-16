import { API_BASE_URL } from './api';

export const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Not Available%3C/text%3E%3C/svg%3E';

export const getImageUrl = (url?: string) => {
    if (!url) return FALLBACK_IMAGE;

    // If it's already a full URL or data URI, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }

    // Ensure we don't double slash
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const finalUrl = `${API_BASE_URL}/${cleanUrl}`;

    // Log for debugging (only in development or if explicitly requested)
    if (process.env.NODE_ENV === 'development') {
        // console.log(`[IMAGE DEBUG] Constructed URL: ${finalUrl} (Original: ${url})`);
    }

    return finalUrl;
};
