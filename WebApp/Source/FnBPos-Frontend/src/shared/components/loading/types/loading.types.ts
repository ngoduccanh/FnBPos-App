export interface LoadingState {
  isLoading: boolean;
  message?: string;
  subMessage?: string;
}

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'white' | 'blue' | 'slate' | 'amber';
