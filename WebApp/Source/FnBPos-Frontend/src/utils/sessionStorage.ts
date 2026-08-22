
export const COOKIE_KEY_USER = 'fnb_pos_user';
export const COOKIE_KEY_STORE = 'fnb_pos_selected_store';

export function saveSession<T>(name: string, value: T): void {
  try {
    const jsonStr = encodeURIComponent(JSON.stringify(value));
    document.cookie = `${name}=${jsonStr}; path=/; SameSite=Lax`;
    localStorage.setItem(name, JSON.stringify(value));
  } catch (err) {
    console.error(`[Session Save Error] Name: ${name}`, err);
  }
}


export function loadSession<T>(name: string): T | null {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const raw = decodeURIComponent(c.substring(nameEQ.length, c.length));
        return JSON.parse(raw);
      }
    }

    const localRaw = localStorage.getItem(name);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      saveSession(name, parsed); 
      return parsed;
    }

    return null;
  } catch (err) {
    console.error(`[Session Read Error] Name: ${name}`, err);
    return null;
  }
}


export function clearSession(name: string): void {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  localStorage.removeItem(name);
}
