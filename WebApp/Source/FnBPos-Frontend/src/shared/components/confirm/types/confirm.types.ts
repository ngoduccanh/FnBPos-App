export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string;
  subMessage?: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}
