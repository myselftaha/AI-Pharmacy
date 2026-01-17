let API_URL;

if (import.meta.env.PROD) {
    // In production (Vercel), usually we want to use the same domain (relative path)
    // However, if the user accidentally set VITE_API_URL to localhost, we must ignore it to prevent breakage.
    // If VITE_API_URL is set and does NOT contain "localhost", we respect it (e.g. separate backend).
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
        API_URL = import.meta.env.VITE_API_URL;
    } else {
        // Default to relative path for Vercel Serverless (Same Domain)
        API_URL = '';
    }
} else {
    // Development fallback
    API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
}

export default API_URL;
