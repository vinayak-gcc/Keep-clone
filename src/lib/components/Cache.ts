// cacheHelper.ts
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const cache = {
  get: (key: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  },

  set: (key: string, data: unknown) => {
    const item = JSON.stringify({ data, timestamp: Date.now() });
    localStorage.setItem(key, item);
  },

  invalidateUser: (userEmail: string) => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`notes:${userEmail}:`)) {
        localStorage.removeItem(key);
      }
    });
  }
};