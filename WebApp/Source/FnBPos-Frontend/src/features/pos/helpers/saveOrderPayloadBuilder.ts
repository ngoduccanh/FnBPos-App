import type { CartItem } from '../mappers/orderDetailMapper';
import type { SaveOrderTemporarilyModel, SaveOrderItemModel } from '../types/saveOrderTemporarily.types';
import type { PosTableItem } from '../types/tables.types';
import { PosSaleEnum } from '@/enums/posSale.enum';


export function buildSaveOrderPayload(
  table: PosTableItem,
  cartItems: CartItem[],
  currUser: any,
  options?: {
    orderNote?: string;
    isCreateEInvoice?: boolean;
    customerInfo?: any;
  }
): SaveOrderTemporarilyModel {
  const storeId = table.storeId || currUser?.storeId || currUser?.StoreId || 0;
  const userId = currUser?.id || currUser?.Id || currUser?.userId || 0;
  const userName = currUser?.fullName || currUser?.FullName || currUser?.userName || 'Nhân viên bán hàng';

  const noteId = table.noteId || table.activeOrder?.noteId || table.orderInfo?.noteId || 0;
  const noteNumber = table.noteNumber || table.activeOrder?.noteNumber || 95;
  const targetId = table.id; 

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (Number(item.product.retailOutPrice) || 0) * item.quantity;
  }, 0);

  const mappedNoteItems: SaveOrderItemModel[] = cartItems.map((cartItem, idx) => {
    const p = cartItem.product;
    const price = Number(p.retailOutPrice) || 0;

    return {
      id: 0,
      noteItemId: 0,
      uId: '',
      productId: p.productId,
      productName: p.productName,
      name: p.productName,
      prodName: p.productName,
      productCode: p.productCode,
      code: p.productCode,
      barcode: p.barcode || '',
      quantity: cartItem.quantity,
      price: price,
      outPrice: price,
      retailPrice: price,
      notes: '',
      status: 255,
      orderStatusId: 255,
      isServerItem: true,
      unitId: p.retailUnitId || 0,
      unitName: p.retailUnitName || '',
      retailUnitId: p.retailUnitId || 0,
      selectedUnitId: p.retailUnitId || 0,
      retailUnitName: p.retailUnitName || '',
      points: 0,
      pointsPercent: 0,
      scorable: false,
      splitQty: 0,
      order: idx + 1,
      factors: 1,
      unit3: 0,
      unit3Factors: 1,
      isModified: true,
      hashValue: 0,
      noteId: noteId,
      groupId: p.groupId || 0,
      storeId: storeId,
      imageThumbUrl: p.imageThumbUrl || undefined,
      customPrices: [
        { price: price, typeId: 0, level: 0, storeId: 0, id: 0, name: 'Bán lẻ' },
        { price: price, typeId: 1, level: 0, storeId: 0, id: 1, name: 'Bán buôn' }
      ],
      product: {
        score: 0,
        id: p.productId,
        name: p.productName,
        code: p.productCode
      }
    };
  });

  const noteItemIds = mappedNoteItems.map(item => item.noteItemId).filter(Boolean);

  return {
    storeId,
    refStoreId: 0,
    noteId,
    name: `Đơn bán bàn ${table.name || ''}`,
    uidHash: 0,
    noteTypeId: 2, 
    taskMode: 0,
    noteDate: new Date().toISOString(),
    updateNoteDate: new Date().toISOString(),
    noteNumber,
    updateNoteNumber: noteNumber,
    createdById: userId,
    sellerId: userId,
    staffId: userId,
    staffName: userName,
    adviserName: userName,
    createdDate: new Date().toISOString(),
    debtAmount: 0,
    paymentAmount: totalAmount,
    totalAmount: totalAmount,
    amount: totalAmount,
    totalVirtualAmount: totalAmount,
    vatEnabled: false,
    vat: 0,
    description: options?.orderNote || '',
    orderId: 0,
    score: 0,
    preScore: 0,
    targetId: targetId, 
    targetName: table.name || '',
    sourceId: 0,
    sourceTypeId: 0,
    targetTypeId: targetId > 0 ? PosSaleEnum.PosReservationSale : PosSaleEnum.PosTakeAWaySale,
    isConnectivity: false,
    isTransferNote: false,
    transferStoreId: 0,
    sourceStoreId: 0,
    targetStoreId: 0,
    autoSynProds: false,
    synchNote: false,
    recordStatusId: 0,
    adviserDiscount: 0,
    isContinue: false,
    fromBarcode: false,
    adviserId: userId,
    partnerId: options?.customerInfo?.partnerId,
    customerId: options?.customerInfo?.partnerId,
    facilityId: 0,
    ePrescriptionTypeId: 0,
    treatmentForm: 0,
    allowToChangeTotalAmount: false,
    discount: 0,
    discountByValue: false,
    discountTotalByValue: false,
    enableVATOnNoteItem: false,
    enableElectronicInvoice: false,
    bonusPaymentId: 0,
    enableTransObjectDetails: false,
    enablePaymentStatuses: false,
    notAutoCombineDuplicatedItemsOnNotes: false,
    allowConnectivityNotesOnChainStores: false,
    timeTypeId: 0,
    autoPrinting: false,
    printTypeId: 0,
    synStatusId: 0,
    orderStatusId: 0,
    paymentTypeId: 0,
    defaultPaymentTypeId: 0,
    paymentMode: 0,
    isPharmacyBiz: false,
    internalTransfer: false,
    prodCount: mappedNoteItems.length,
    showScoreStaff: false,
    isInvoiceExp: false,
    invStatusId: 0,
    usePointsOnProductMethod: false,
    enableZNS: false,
    enableQRPayment: false,
    isClinic: false,
    patientRecordId: 0,
    reloadCache: false,
    jobId: 0,
    batchExpInReceiptDeliveryNotes: false,
    enableCreateDateNotes: false,
    printDeliveryPrescribedFrom: false,
    subNoteTypeId: 0,
    cleanDuplicatedItems: false,
    recordHash: 0,
    order: 0,
    allowDeliveryOverQuantity: true,
    isEPrescription: false,
    enableAutoDelivery: false,
    deliveryDay1: 0,
    deliveryDay2: 0,
    partnerScore: 0,
    paraclinicalType: 0,
    showHistory: false,
    displayDosage: false,
    useComboPrice: false,
    warehouseTransfer: false,
    isCreateEInvoice: options?.isCreateEInvoice || false,
    isExportDraftInvoice: false,
    saveNoteFromPrescription: false,
    quantitiesValidation: true,
    paymentQRModel: {
      code: '',
      accountNo: '',
      accountName: '',
      amount: totalAmount,
      acqId: ''
    },
    noteItems: mappedNoteItems,
    noteItemIds,
    isForceReloadInventory: true
  };
}
