// Settings that can differ between environments. Values come from the .env file.
export const config = Object.freeze({
  apiUrl: import.meta.env.VITE_API_URL || 'https://watchnext.alwaysdata.net',
});
