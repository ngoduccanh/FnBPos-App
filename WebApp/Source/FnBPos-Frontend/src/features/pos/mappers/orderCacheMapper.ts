import type { DeliveryNoteWithRoundsModel, OrderRoundModel } from '@/shared/types/deliveryNote.types';
import type { ProductDeliveryItem } from '@/shared/types/productDeliveryItem.types';

/**
 * 🔄 Ánh xạ chi tiết từng dòng món ăn trong đơn hàng
 */
export const mapNoteItem = (item: any): ProductDeliveryItem => {
  const price = Number(item.retailPrice ?? item.price ?? item.retailOutPrice ?? item.outPrice ?? 0);
  const quantity = Number(item.quantity ?? item.retailQuantity ?? 1);
  const totalAmount = Number(item.totalAmount ?? (price * quantity));

  return {
    noteItemId: Number(item.noteItemId ?? item.id ?? item.NoteItemId ?? 0),
    noteId: Number(item.noteId ?? item.NoteId ?? 0),
    noteTypeId: Number(item.noteTypeId ?? 0),
    productId: Number(item.productId ?? item.product?.id ?? item.ProductId ?? 0),
    productCode: item.productCode ?? item.code ?? item.product?.code ?? '',
    prodName: item.prodName ?? item.productName ?? item.name ?? item.product?.name ?? '',
    retailPrice: price,
    price: price,
    inPrice: Number(item.inPrice ?? 0),
    outPrice: price,
    retailOutPrice: price,
    prodRetailInPrice: 0,
    prodRetailOutPrice: price,
    prodBatchOutPrice: 0,
    minBatchQuantity: 0,
    salaryPrice: 0,
    quantity: quantity,
    usedQuantity: 0,
    remainingQuantity: quantity,
    sourceId: 0,
    sourceNoteId: 0,
    retailQuantity: quantity,
    preRetailQuantity: 0,
    totalAmount: totalAmount,
    vatAmount: 0,
    lastInventoryQuantity: Number(item.lastInventoryQuantity ?? -1),
    discount: Number(item.discount ?? 0),
    isModified: false,
    editMode: false,
    isEditingItem: false,
    productTypeId: 1,
    productStatusId: Number(item.orderStatusId ?? 0),
    hasConnectivityErrors: false,
    isConnectivity: false,
    connectivityProdId: 0,
    discountByValue: false,
    discountValue: 0,
    scorable: false,
    moneyToOneScoreRate: 0,
    advisoryGoods: false,
    advisoryDiscount: 0,
    priceFactors: 1,
    isProdRef: false,
    saleTypeId: 0,
    saleOff: 0,
    paid: false,
    averagePrice: price,
    isInvoice: false,
    originalProdId: 0,
    prodIsNotExisted: false,
    unitIsNotExisted: false,
    unit: item.unit ?? item.retailUnitName ?? item.unitName ?? item.selectedUnitName ?? '',
    productCoefficient: 1,
    lossPercent: 0,
    prodType: 1,
    recordHash: 0,
    quantityPerOneDose: 0,
    facilityId: 0,
    medicalFacility: 0,
    noteNumber: 0,
    batchUid: 0,
    createdDate: item.createdDate ?? item.CreatedDate ?? item.time ?? item.Time ?? '',
    routeTypeId: 0,
    formalityId: 0,
    morning: 0,
    noon: 0,
    afternoon: 0,
    evening: 0
  } as unknown as ProductDeliveryItem;
};

/**
 * 🔄 Ánh xạ từng lượt gọi món (OrderRound)
 */
export const mapOrderRound = (round: any, index: number): OrderRoundModel => {
  const rawItems = round.items ?? round.Items ?? [];
  return {
    roundNumber: Number(round.roundNumber ?? round.RoundNumber ?? (index + 1)),
    time: round.time ?? round.Time ?? round.createdDate ?? '',
    items: Array.isArray(rawItems) ? rawItems.map(mapNoteItem) : []
  };
};

/**
 * 🔄 Ánh xạ toàn bộ danh sách đơn hàng từ cache (Tự động khử trùng lặp Deduplicate)
 */
export const mapOrderCacheToDeliveryNoteWithRoundsModel = (orderCache: any): DeliveryNoteWithRoundsModel[] => {
  if (!orderCache || !Array.isArray(orderCache)) {
    return [];
  }

  const mappedList: DeliveryNoteWithRoundsModel[] = [];
  const seenKeys = new Set<string>();

  for (let idx = 0; idx < orderCache.length; idx++) {
    const item = orderCache[idx];
    if (!item) continue;

    const noteId = Number(item.noteId ?? item.NoteId ?? 0);
    const targetId = Number(item.targetId ?? item.TargetId ?? 0);

    // Khóa định danh duy nhất cho đơn hàng (ưu tiên noteId, nếu không có thì dùng targetId)
    const uniqueKey = noteId > 0 ? `note_${noteId}` : (targetId > 0 ? `target_${targetId}` : `idx_${idx}`);

    // Nếu đã tồn tại đơn hàng này rồi -> Bỏ qua duplicate
    if (seenKeys.has(uniqueKey)) {
      console.warn(`[orderCacheMapper] ⚠️ Phát hiện đơn trùng lặp (${uniqueKey}) -> Tự động loại bỏ.`);
      continue;
    }
    seenKeys.add(uniqueKey);

    const rawItems = item.noteItems ?? item.NoteItems ?? [];
    const rawRounds = item.orderRounds ?? item.OrderRounds ?? [];

    const mappedItems = Array.isArray(rawItems) ? rawItems.map(mapNoteItem) : [];
    
    // Nếu có sẵn rounds từ backend thì map, nếu chưa có thì tự động gom nhóm theo createdDate
    let mappedRounds: OrderRoundModel[] = [];
    if (Array.isArray(rawRounds) && rawRounds.length > 0) {
      mappedRounds = rawRounds.map(mapOrderRound);
    } else if (mappedItems.length > 0) {
      // Nhóm món theo createdDate làm từng lượt
      const roundGroups = new Map<string, ProductDeliveryItem[]>();
      mappedItems.forEach(mi => {
        const timeKey = mi.createdDate || 'Đợt 1';
        if (!roundGroups.has(timeKey)) {
          roundGroups.set(timeKey, []);
        }
        roundGroups.get(timeKey)!.push(mi);
      });

      let rNum = 1;
      roundGroups.forEach((items, timeKey) => {
        mappedRounds.push({
          roundNumber: rNum++,
          time: timeKey,
          items: items
        });
      });
    }

    mappedList.push({
      noteId: noteId,
      targetId: targetId,
      targetTypeId: Number(item.targetTypeId ?? item.TargetTypeId ?? 0),
      name: item.name ?? item.Name ?? item.targetName ?? item.TargetName ?? `Bàn #${targetId || idx + 1}`,
      noteNumber: Number(item.noteNumber ?? item.NoteNumber ?? 0),
      noteDate: item.noteDate ?? item.NoteDate ?? '',
      createdDate: item.createdDate ?? item.CreatedDate ?? '',
      totalAmount: Number(item.totalAmount ?? item.TotalAmount ?? 0),
      prodCount: Number(item.prodCount ?? item.ProdCount ?? mappedItems.length),
      customerName: item.customerName ?? item.CustomerName ?? 'Khách lẻ',
      orderStatusId: Number(item.orderStatusId ?? item.OrderStatusId ?? item.statusTypeId ?? item.StatusTypeId ?? 0),
      orderRounds: mappedRounds,
      noteItems: mappedItems,
      order: 0,
      allowDeliveryOverQuantity: false,
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
      isCreateEInvoice: false,
      isExportDraftInvoice: false,
      saveNoteFromPrescription: false,
      quantitiesValidation: false
    } as DeliveryNoteWithRoundsModel);
  }

  return mappedList;
};
