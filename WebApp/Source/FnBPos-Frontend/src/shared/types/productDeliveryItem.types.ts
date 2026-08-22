import type { BaseNoteItem } from './baseNoteItem.types';

export interface ProductDeliveryItem extends BaseNoteItem {
  createdDate?: string;
  orderStatusId?: number;
  quantityPerOneDose: number;
  doctorName?: string;
  customerName?: string;
  customerAddresses?: string;
  facilityId: number;
  facilityName?: string;
  medicalFacility: number;
  directedByAdviser?: string;
  result?: string;
  zaloNumber?: string;
  noteNumber: number;
  ePrescriptionCode?: string;
  morning: number;
  noon: number;
  afternoon: number;
  evening: number;
  formalityId: number;
  routeTypeId: number;
  filePath?: string;
  batchExp?: any;
  teeth?: string;
  paraclinicalResult?: any;
  customPrices?: any[];
  batchUid: number;
}
