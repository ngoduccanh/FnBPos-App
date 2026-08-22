import type { BaseNoteModel } from './baseNote.types';
import type { ProductDeliveryItem } from './productDeliveryItem.types';

export interface OrderCacheItem {
  noteId: number;
  targetId: number;
}

export interface OrderRoundModel {
  roundNumber: number;
  time: string; 
  items?: ProductDeliveryItem[]; 
}


export interface DeliveryNoteModel extends BaseNoteModel {
  order: number;
  allowDeliveryOverQuantity: boolean;
  directedByAdviser?: string;
  medicalFacility?: string;
  isEPrescription: boolean;
  enableAutoDelivery: boolean;
  deliveryDay1: number;
  deliveryDay2: number;
  zaloNumber?: string;
  partnerScore: number;
  paraclinicalType: number;
  showHistory: boolean;
  displayDosage: boolean;
  diseaseName?: string;
  discountItemIds?: number[];
  imageIds?: string;
  imageUrls?: string[];
  discountNoteItems?: any[]; 
  useComboPrice: boolean;
  idc10Notes?: any[]; 
  noteItems?: any[];
  delNoteItems?: ProductDeliveryItem[];

  customerName?: string;
  customerAddresses?: string;
  customerTaxCode?: string;
  customerEmail?: string;

  doctorName?: string;
  adviserName?: string;
  facilityName?: string;
  warehouseTransfer: boolean;
  isCreateEInvoice: boolean;
  isExportDraftInvoice: boolean;
  defaultProducts?: ProductDeliveryItem[];
  logNoteFile?: string;
  saveNoteFromPrescription: boolean;
  quantitiesValidation: boolean;
}


export interface DeliveryNoteWithRoundsModel extends DeliveryNoteModel {
  orderRounds?: OrderRoundModel[];
}
