import { useAuthStore } from '@/stores/auth';
import { loginByStoreApi, refreshTokenApi } from '@/features/auth/api/authApi';
import { loadSession } from '@/utils/sessionStorage';
import { COOKIE_KEY_USER, COOKIE_KEY_STORE } from '@/utils/sessionStorage';
import type { User } from '@/features/auth/types/user.types';
import type { StoreBranch } from '@/features/select-store/types/store.types';

let isInitialized = false;

export async function restoreSessionOnRefresh(): Promise<boolean> {
  const authStore = useAuthStore();

  if (isInitialized && authStore.isAuthenticated) {
    return true;
  }

  const localUser = loadSession<User | any>(COOKIE_KEY_USER);
  const localStore = loadSession<StoreBranch>(COOKIE_KEY_STORE);

  if (!localUser) {
    authStore.logout();
    isInitialized = true;
    return false;
  }


  const refreshToken = localUser?.refreshToken || localUser?.RefreshToken;
  if (refreshToken) {
    try {
      const res: any = await refreshTokenApi(refreshToken);
      const loginData = res?.Data || (res?.accessToken || res?.id ? res : null);

      if (loginData) {
        authStore.setLoginData(loginData);
        if (localStore) {
          authStore.selectStore(localStore);
        }
        isInitialized = true;
        return true;
      }
    } catch (err) {
      console.warn('[SessionRestore] Refresh Token failed, trying fallback...', err);
    }
  }

  if (localStore && localStore.id) {
    try {
      const res: any = await loginByStoreApi(localStore.id);
      const loginData = res?.Data || (res?.accessToken || res?.id ? res : null);

      if (loginData) {
        authStore.setLoginData(loginData);
        authStore.selectStore(localStore);
        isInitialized = true;
        return true;
      }
    } catch (err) {
      console.warn('[SessionRestore] LoginByStore failed', err);
    }
  }

  authStore.logout();
  isInitialized = true;
  return false;
}

export function resetSessionRestoreState(): void {
  isInitialized = false;
}
