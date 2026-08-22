import type { PosTableItem } from '../types/tables.types';

export const mapTableOptions = (rawList: any[]): PosTableItem[] => {
  if (!Array.isArray(rawList)) return [];

  const list: PosTableItem[] = rawList.map(item => ({
    id: item.id ??  0,
    code: item.code ?? '',
    name: item.name ??  item.value ??  '',
    note: item.notes ?? '',
    groupId: item.groupId ?? 0,
    activated: item.activated  ?? true,
    typeId: item.typeId  ?? 0,
    status: item.status ?? 'EMPTY'
  }));

  // Sắp xếp danh sách bàn theo thứ tự tăng dần chuẩn tiếng Việt (Bàn 1, Bàn 2, Bàn 3... Bàn 10)
  list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { numeric: true }));

  return list;
};