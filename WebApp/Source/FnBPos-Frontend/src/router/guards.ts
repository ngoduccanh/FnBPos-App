import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { restoreSessionOnRefresh } from '@/services/sessionRestoreService';

export function setupNavigationGuards(router: Router): void {
  router.beforeEach(async (to, _from, next) => {
    if (to.meta.title) {
      document.title = to.meta.title as string;
    }
    const authStore = useAuthStore();

    await restoreSessionOnRefresh();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return next('/login');
    }

   
    if (to.path === '/login' && authStore.isAuthenticated) {
      return next('/pos');
    }

    if (to.meta.requireStore && !authStore.hasSelectedStore) {
      return next('/select-store');
    }

    next();
  });
}
