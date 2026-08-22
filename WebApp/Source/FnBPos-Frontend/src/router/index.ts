import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { setupNavigationGuards } from './guards';

export const router = createRouter({
  history: createWebHistory(),
  routes
});

setupNavigationGuards(router);

export default router;
