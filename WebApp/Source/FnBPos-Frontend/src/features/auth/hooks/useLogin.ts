import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/shared/components/toast/composables/useToast';
import { loginApi } from '../api/authApi';
import { clearAllPosDatabase } from '@/services/posDexieDB/posDatabase';
import type { LoginCredentials } from '../types/auth.types';

const REMEMBER_USER_KEY = 'fnb_pos_remembered_username';
const REMEMBER_PASS_KEY = 'fnb_pos_remembered_password';

export function useLogin() {
  const router = useRouter();
  const authStore = useAuthStore();
  const toast = useToast();

  const isLoading = ref(false);
  const errorMessage = ref('');
  const rememberMe = ref(true);

  const credentials = reactive<LoginCredentials>({
    username: '',
    password: ''
  });

  // Tự động khôi phục tài khoản đã lưu khi nạp trang
  onMounted(() => {
    const savedUser = localStorage.getItem(REMEMBER_USER_KEY);
    const savedPass = localStorage.getItem(REMEMBER_PASS_KEY);

    if (savedUser) {
      credentials.username = savedUser;
      rememberMe.value = true;
    }
    if (savedPass) {
      credentials.password = savedPass;
    }
  });

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) return;

    isLoading.value = true;
    errorMessage.value = '';

    try {
      const res: any = await loginApi(credentials);
      console.log('[Login API Response]', res);

      const loginData = res?.Data || (res?.accessToken || res?.id ? res : null);

      if (loginData) {
        // 🧹 XÓA SẠCH TOÀN BỘ DEXIE DB CỦA PHIÊN CŨ TRƯỚC KHI VÀO PHIÊN MỚI
        await clearAllPosDatabase();

        authStore.setLoginData(loginData);

        // Lưu hoặc xóa thông tin ghi nhớ đăng nhập
        if (rememberMe.value) {
          localStorage.setItem(REMEMBER_USER_KEY, credentials.username);
          localStorage.setItem(REMEMBER_PASS_KEY, credentials.password);
        } else {
          localStorage.removeItem(REMEMBER_USER_KEY);
          localStorage.removeItem(REMEMBER_PASS_KEY);
        }

        toast.showSuccess('Đăng nhập thành công! Đang chuyển hướng...', 'Xác thực thành công');

        if (authStore.selectedStore) {
          router.push('/pos');
        } else {
          router.push('/select-store');
        }
      } else {
        errorMessage.value = res?.Errors?.[0] || res?.message || 'Tài khoản hoặc mật khẩu không đúng.';
        toast.showError(errorMessage.value, 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error('[Login Error]', err);

      const status = err?.status || err?.response?.status;
      if (status === 401 || err?.statusCode === 401) {
        errorMessage.value = 'Tài khoản hoặc mật khẩu không đúng.';
      } else {
        errorMessage.value =
          err?.Errors?.[0] ||
          err?.message ||
          'Tài khoản hoặc mật khẩu không đúng.';
      }
      toast.showError(errorMessage.value, 'Đăng nhập thất bại');
    } finally {
      isLoading.value = false;
    }
  };

  return {
    credentials,
    isLoading,
    errorMessage,
    rememberMe,
    handleLogin
  };
}
