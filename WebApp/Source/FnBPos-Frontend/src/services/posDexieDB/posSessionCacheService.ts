import { db } from './posDatabase';
import type { HomeViewModelData } from '@/shared/types/storeSession.types';
import type { PosTableAreaGroup } from '@/features/pos/types/tables.types';

// ─────────────────────────────────────────────────────────────────────────────
// HOME VIEW MODEL CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lưu HomeViewModel vào Dexie theo storeId.
 * Gọi sau khi API trả về thành công.
 */
export async function saveHomeViewModelCache(storeId: number, data: HomeViewModelData): Promise<void> {
  await db.homeViewModelCache.put({
    storeId,
    data: JSON.parse(JSON.stringify(data)), // strip Vue Proxy
    cachedAt: Date.now()
  });
}

/**
 * Đọc HomeViewModel từ Dexie theo storeId.
 * Trả về null nếu chưa có cache.
 */
export async function getHomeViewModelCache(storeId: number): Promise<HomeViewModelData | null> {
  const record = await db.homeViewModelCache.get(storeId);
  return record?.data ?? null;
}

/**
 * Xóa HomeViewModel cache theo storeId.
 * Gọi khi đổi cửa hàng hoặc logout.
 */
export async function clearHomeViewModelCache(storeId?: number): Promise<void> {
  if (storeId) {
    await db.homeViewModelCache.delete(storeId);
  } else {
    await db.homeViewModelCache.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE AREA CACHE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lưu danh sách khu vực bàn vào Dexie theo storeId.
 * Gọi sau khi API trả về thành công.
 */
export async function saveTableAreaCache(storeId: number, groups: PosTableAreaGroup[]): Promise<void> {
  await db.tableAreaCache.put({
    storeId,
    groups: JSON.parse(JSON.stringify(groups)), // strip Vue Proxy
    cachedAt: Date.now()
  });
}

/**
 * Đọc danh sách khu vực bàn từ Dexie theo storeId.
 * Trả về null nếu chưa có cache.
 */
export async function getTableAreaCache(storeId: number): Promise<PosTableAreaGroup[] | null> {
  const record = await db.tableAreaCache.get(storeId);
  return record?.groups ?? null;
}

/**
 * Xóa TableArea cache theo storeId.
 * Gọi khi đổi cửa hàng hoặc logout.
 */
export async function clearTableAreaCache(storeId?: number): Promise<void> {
  if (storeId) {
    await db.tableAreaCache.delete(storeId);
  } else {
    await db.tableAreaCache.clear();
  }
}

/**
 * Xóa toàn bộ session cache (HomeViewModel + TableArea).
 * Gọi khi logout hoặc đổi cửa hàng.
 */
export async function clearAllSessionCache(): Promise<void> {
  await Promise.all([
    db.homeViewModelCache.clear(),
    db.tableAreaCache.clear()
  ]);
}
