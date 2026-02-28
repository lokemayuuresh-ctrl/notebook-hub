export const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImage Not Available%3C/text%3E%3C/svg%3E';

export const getImageUrl = (url?: string) => {
    if (!url) return FALLBACK_IMAGE;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};
