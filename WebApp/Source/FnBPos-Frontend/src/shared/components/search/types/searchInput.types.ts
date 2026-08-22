export interface SearchInputProps {

  modelValue: string;

  placeholder?: string;

  delay?: number;

  disabled?: boolean;

  clearable?: boolean;

  autoFocus?: boolean;
}

export interface SearchInputEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
  (e: 'clear'): void;
}
