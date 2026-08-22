import type { User } from './user.types';
import type { StoreBranch } from '@/features/select-store/types/store.types';

export interface LoginCredentials {
  username: string;
  password?: string;
  isRemember?: boolean;
}

export interface LoginResponseData extends User {
  accessToken: string;
  refreshToken?: string;
  store?: StoreBranch;
  stores?: StoreBranch[];
}
