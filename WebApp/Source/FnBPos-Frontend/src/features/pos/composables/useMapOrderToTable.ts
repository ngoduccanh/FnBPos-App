import type { PosTableItem } from '../types/tables.types';
import type { DeliveryNoteWithRoundsModel } from '@/shared/types/deliveryNote.types';
import { ETableStatusFilter } from '../enums/tableStatusFilter.enum';
import { formatTime } from '@/shared/utils/dateFormatter';


export function useMapOrderToTable() {

  const mapOrderToTable = (tables: PosTableItem[], orders: DeliveryNoteWithRoundsModel[]): PosTableItem[] => {
    if (!tables || !Array.isArray(tables)) return [];
    if (!orders || !Array.isArray(orders)) return tables;

    const orderMap = new Map<number, DeliveryNoteWithRoundsModel>();
    orders.forEach(order => {
      if (order.targetId) {
        orderMap.set(order.targetId, order);
      }
    });

    return tables.map(table => {
      const matchedOrder = orderMap.get(table.id);

      if (matchedOrder) {
        let totalMondCount = matchedOrder.prodCount || 0;
        if (!totalMondCount && matchedOrder.orderRounds?.length) {
          totalMondCount = matchedOrder.orderRounds.reduce((acc, round) => acc + (round.items?.length || 0), 0);
        } else if (!totalMondCount && matchedOrder.noteItems?.length) {
          totalMondCount = matchedOrder.noteItems.length;
        }

        const formattedTime = formatTime(matchedOrder.noteDate);

        return {
          ...table,
          status: ETableStatusFilter.USING, 
          activeOrder: matchedOrder,
          customerName: matchedOrder.customerName || 'Khách lẻ',
          totalAmount: matchedOrder.totalAmount || 0,
          prodCount: totalMondCount,
          timeStarted: formattedTime,
          noteId: matchedOrder.noteId,
          noteNumber: matchedOrder.noteNumber
        };
      }

      return {
        ...table,
        status: table.status && table.status !== ETableStatusFilter.USING ? table.status : ETableStatusFilter.EMPTY,
        activeOrder: null,
        customerName: undefined,
        totalAmount: 0,
        prodCount: 0,
        timeStarted: undefined
      };
    });
  };

  return {
    mapOrderToTable
  };
}
