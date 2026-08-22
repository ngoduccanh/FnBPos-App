import { postRemoteUrl } from '@/services/apiClient';
import type { LoginCredentials, LoginResponseData } from '../types/auth.types';
import type { BaseApiResponse } from '@/shared/types/base.types';
import type { GetObjectListingParams } from '@/shared/types';
import { EObjectType } from '@/enums/objectType.enum';

// 1. API Đăng nhập
export const loginApi = (credentials: LoginCredentials) => {
  return postRemoteUrl<BaseApiResponse<LoginResponseData>>('/api/login', credentials);
};

// 2. API Refresh Token
export const refreshTokenApi = (refreshToken: string) => {
  return postRemoteUrl<BaseApiResponse<LoginResponseData>>('/api/refresh', {
    refreshToken: refreshToken
  });
};

// 3. API Login By Store (Tạo Session Cửa hàng trên C# Server)
export const loginByStoreApi = (storeId: number) => {
  return postRemoteUrl<BaseApiResponse<LoginResponseData>>('/api/login-by-store', {
    storeId: storeId
  });
};

// 4. API Đăng xuất
export const logoutApi = () => {
  return postRemoteUrl<BaseApiResponse<void>>('/api/logout');
};

// 5. API Lấy danh sách đối tượng Cửa hàng
export const getObjectListingDataApi = (params?: Partial<GetObjectListingParams>) => {
  const defaultParams: GetObjectListingParams = {
    SwitchAble: 1,
    PageIndex: 0,
    PageSize: 50,
    SortingDirection: 0,
    SearchText: '',
    TypeId: EObjectType.Store,
    StoreId: 2,
    StoreForNewSession: true,
    ...params
  };

  return postRemoteUrl<any>('/api/object/GetObjectListingData', defaultParams);
};
