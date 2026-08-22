import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserPermissionsMap } from '@/features/auth/types/user.types';
import type { StoreBranch } from '@/features/select-store/types/store.types';
import type { LoginResponseData } from '@/features/auth/types/auth.types';
import {
  COOKIE_KEY_USER,
  COOKIE_KEY_STORE,
  saveSession,
  clearSession
} from '@/utils/sessionStorage';


export const useAuthStore = defineStore('auth', () => {

  const user = ref<User | null>(null);

  const selectedStore = ref<StoreBranch | null>(null);

  const availableStores = ref<StoreBranch[]>([]);


  const isAuthenticated = computed(() => !!user.value && !!user.value.id);

  const hasSelectedStore = computed(() => !!selectedStore.value);
  
  const permissions = computed<UserPermissionsMap>(() => user.value?.permissions || {});

  const isAdmin = computed(() => {
    if (!user.value) return false;
    return (
      user.value.isAdmin === true ||
      user.value.isSystemAdmin === true ||
      user.value.isSuperUser === true
    );
  });

  const hasPermission = (permissionKey?: string): boolean => {
    if (!user.value) return false;
    if (isAdmin.value) return true;
    if (!permissionKey) return true;
    return permissions.value[permissionKey] === true;
  };

  const canAccessPos = computed(() => {
    return isAuthenticated.value && hasSelectedStore.value;
  });

  const setLoginData = (data: LoginResponseData | any) => {
    if (!data) return;

    const normalizedData = {
      ...data,
      accessToken: data.accessToken || data.AccessToken || '',
      refreshToken: data.refreshToken || data.RefreshToken || ''
    };

    user.value = normalizedData;
    saveSession(COOKIE_KEY_USER, normalizedData);

    const defaultStore = data.store || data.Store;
    if (defaultStore && (defaultStore.id || defaultStore.Id)) {
      selectStore(defaultStore);
    }

    if (data.stores && data.stores.length > 0) {
      availableStores.value = data.stores;
    }
  };

  const selectStore = (store: StoreBranch) => {
    selectedStore.value = store;
    saveSession(COOKIE_KEY_STORE, store);
  };

  const logout = () => {
    user.value = null;
    selectedStore.value = null;
    availableStores.value = [];
    clearSession(COOKIE_KEY_USER);
    clearSession(COOKIE_KEY_STORE);
  };

  return {
    user,
    selectedStore,
    availableStores,
    permissions,
    isAuthenticated,
    hasSelectedStore,
    isAdmin,
    hasPermission,
    canAccessPos,
    setLoginData,
    selectStore,
    logout
  };
});
