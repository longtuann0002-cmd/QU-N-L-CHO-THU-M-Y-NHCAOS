/**
 * utils/supabase.ts - Compatibility shim
 * Cung cap API cu (syncToSupabase, fetchFromSupabase, isSupabaseConfigured)
 * bang cach dung lai lib/db.ts va lib/supabase.ts hien tai.
 */

import { isSupabaseConfigured as _isConfigured } from '../lib/supabase';
import {
  fetchCameras,
  fetchContracts,
  fetchCustomers,
  fetchExpenses,
  upsertCameras,
  upsertContracts,
  upsertCustomers,
  upsertExpenses,
  saveSetting,
  loadSetting,
} from '../lib/db';

/** Boolean cho phep dung nhu `if (isSupabaseConfigured)` */
export const isSupabaseConfigured: boolean = _isConfigured();

/**
 * Dong bo mot bang du lieu len Supabase.
 */
export async function syncToSupabase(table: string, data: any[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    switch (table) {
      case 'cameras':
        await upsertCameras(data);
        break;
      case 'contracts':
        await upsertContracts(data);
        break;
      case 'customers':
        await upsertCustomers(data);
        break;
      case 'expenses':
        await upsertExpenses(data);
        break;
      case 'registeredUsers':
        await saveSetting('registeredUsers', data);
        break;
      case 'camlease_snapshots':
        await saveSetting('camlease_snapshots', data);
        break;
      default:
        await saveSetting(table, data);
        break;
    }
  } catch (err) {
    console.error('[supabase-compat] syncToSupabase(' + table + ') error:', err);
  }
}

/**
 * Tai du lieu tu Supabase theo ten bang.
 * Tra ve null neu that bai (App.tsx kiem tra falsy de fallback localStorage).
 */
export async function fetchFromSupabase(table: string): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    switch (table) {
      case 'cameras':
        return await fetchCameras();
      case 'contracts':
        return await fetchContracts();
      case 'customers':
        return await fetchCustomers();
      case 'expenses':
        return await fetchExpenses();
      case 'registeredUsers':
        return await loadSetting<any[]>('registeredUsers', []);
      case 'camlease_snapshots':
        return await loadSetting<any[]>('camlease_snapshots', []);
      default:
        return await loadSetting<any[]>(table, []);
    }
  } catch (err) {
    console.error('[supabase-compat] fetchFromSupabase(' + table + ') error:', err);
    return null;
  }
}