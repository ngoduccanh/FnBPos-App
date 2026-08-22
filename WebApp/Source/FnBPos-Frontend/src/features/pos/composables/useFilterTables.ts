import { ref, computed, type Ref } from 'vue';
import type { PosTableItem } from '../types/tables.types';
import { ETableStatusFilter } from '../enums/tableStatusFilter.enum';

export function useFilterTables(tablesRef: Ref<PosTableItem[]>) {
  const selectedGroupId = ref<number>(0); 
  const selectedStatus = ref<ETableStatusFilter>(ETableStatusFilter.ALL);
  const selectedTable = ref<PosTableItem | null>(null);


  const filteredTables = computed(() => {
    let list = tablesRef.value;

 
    if (selectedGroupId.value === -1) {
      const takeawayTables = list.filter(table => table.id === 0 || table.groupId === 0);
      list = takeawayTables.length > 0 ? takeawayTables : list.filter(table => table.id === 0);
    } else if (selectedGroupId.value && selectedGroupId.value !== 0) {
      list = list.filter(table => table.groupId === selectedGroupId.value);
    }

    if (selectedStatus.value !== ETableStatusFilter.ALL) {
      if (selectedStatus.value === ETableStatusFilter.EMPTY) {
        list = list.filter(table => table.status === 'READY' || table.status === 'EMPTY' || !table.status);
      } else {
        list = list.filter(table => table.status === selectedStatus.value);
      }
    }

    return list;
  });

  const filterByGroup = (groupId: number) => {
    selectedGroupId.value = groupId;
  };

  const filterByStatus = (status: ETableStatusFilter) => {
    if (selectedStatus.value === status) {
      selectedStatus.value = ETableStatusFilter.ALL;
    } else {
      selectedStatus.value = status;
    }
  };

  const selectTable = (table: PosTableItem | null) => {
    selectedTable.value = table;
  };

  return {
    selectedGroupId,
    selectedStatus,
    selectedTable,
    filteredTables,
    filterByGroup,
    filterByStatus,
    selectTable
  };
}
