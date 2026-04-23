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
