import type { CartItem } from '../mappers/orderDetailMapper';

export interface TableCartCacheRecord {
  targetId: number; 
  noteId: number;  
  items: CartItem[]; 
  updatedAt: string;
}
