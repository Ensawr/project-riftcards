// The browser already provides localStorage.
export const authStorage = typeof window === 'undefined' ? undefined : window.localStorage;
