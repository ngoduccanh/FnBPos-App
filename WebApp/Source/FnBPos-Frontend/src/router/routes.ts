import type { RouteRecordRaw } from 'vue-router';


export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/pos'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: { requiresAuth: false, title: 'Đăng nhập - FnB POS' }
  },
  {
    path: '/select-store',
    name: 'SelectStore',
    component: () => import('@/features/select-store/views/SelectStoreView.vue'),
    meta: { requiresAuth: true, title: 'Chọn Cửa Hàng làm việc' }
  },
  {
    path: '/pos',
    name: 'PosMain',
    component: () => import('@/features/pos/views/PosMainView.vue'),
    meta: { requiresAuth: true, requireStore: true, title: 'Màn hình Bán hàng POS' }
  },
  {
    path: '/customer-display',
    name: 'CustomerDisplay',
    component: () => import('@/features/pos/views/CustomerDisplayView.vue'),
    meta: { requiresAuth: false, title: 'Màn hình phụ Khách hàng - FnB POS' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/pos'
  }
];
