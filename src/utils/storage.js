export const getLocalStorage = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

export const setLocalStorage = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export const removeLocalStorage = (key) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

export const getSessionStorage = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading ${key} from sessionStorage:`, error);
    return null;
  }
};

export const setSessionStorage = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error writing ${key} to sessionStorage:`, error);
  }
};

export const removeSessionStorage = (key) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from sessionStorage:`, error);
  }
};

// Add these at the bottom of storage.js

export const isImpersonating = () => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("isImpersonating");
    if (!raw) return false;
    return JSON.parse(raw)?.isImpersonating === true;
  } catch {
    return false;
  }
};

export const makeLocationKey = (accountId, locationId) =>
  `autoReply_${String(accountId || "").replace(/^accounts\//, "")}_${locationId}`;
