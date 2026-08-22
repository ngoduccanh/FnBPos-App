import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';

export const apiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});


apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken && config.method?.toLowerCase() === 'post') {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    const authStore = useAuthStore();
    const token = (authStore.user as any)?.accessToken || (authStore.user as any)?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;

    if (resData && typeof resData === 'object' && 'Status' in resData) {
      const isSuccess = resData.Status === '200' || resData.Status === 'OK' || resData.Status === 200;
      if (!isSuccess) {
        const errorMsg = resData.Errors?.[0] || resData.Message || 'Có lỗi xảy ra từ máy chủ API';
        return Promise.reject(new Error(errorMsg));
      }
    }

    return resData;
  },
  (error) => {
    const httpStatus = error.response?.status;
    const errObj = error.response?.data || error;

    if (typeof errObj === 'object' && errObj !== null) {
      (errObj as any).status = httpStatus;
    }

    return Promise.reject(errObj);
  }
);

export async function requestRemoteUrl<T = any>(
  url: string,
  dataOrMethod?: any,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  let finalMethod: 'GET' | 'POST' = method;
  let finalData: any = dataOrMethod;

  if (typeof dataOrMethod === 'string' && (dataOrMethod.toUpperCase() === 'GET' || dataOrMethod.toUpperCase() === 'POST')) {
    finalMethod = dataOrMethod.toUpperCase() as 'GET' | 'POST';
    finalData = undefined;
  }

  if (finalMethod === 'GET') {
    const res = await apiClient.get(url, { params: finalData });
    return res as unknown as T;
  }
  const res = await apiClient.post(url, finalData);
  return res as unknown as T;
}


export async function getRemoteUrl<T = any>(url: string, params?: any): Promise<T> {
  const res = await apiClient.get(url, { params });
  return res as unknown as T;
}


export async function postRemoteUrl<T = any>(url: string, data?: any): Promise<T> {
  const res = await apiClient.post(url, data);
  return res as unknown as T;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
