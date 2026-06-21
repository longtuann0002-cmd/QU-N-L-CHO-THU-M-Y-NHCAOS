import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from localStorage first, then fallback to environment variables
let savedUrl = '';
let savedKey = '';
try {
  savedUrl = localStorage.getItem('camlease_supabase_url') || '';
  savedKey = localStorage.getItem('camlease_supabase_key') || '';
} catch (e) {
  console.error('[Supabase] Error reading from localStorage', e);
}

const metaEnv = (import.meta as any).env || {};
const envUrl = metaEnv.VITE_SUPABASE_URL || '';
const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export let supabaseUrl = savedUrl || envUrl || '';
export let supabaseAnonKey = savedKey || envKey || '';

export function checkIsConfigured(url = supabaseUrl, key = supabaseAnonKey): boolean {
  return !!(
    url &&
    key &&
    url !== 'YOUR_SUPABASE_URL' &&
    url !== 'YOUR_SUPABASE_URL_HERE' &&
    !url.toLowerCase().includes('placeholder') &&
    url.startsWith('https://')
  );
}

// Global flag to match the original export
export let isSupabaseConfigured = checkIsConfigured();

// Initialize Supabase client dynamically
export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Update Supabase configuration dynamically
 */
export function updateSupabaseConfig(url: string, key: string): boolean {
  try {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim();
    const configured = checkIsConfigured(trimmedUrl, trimmedKey);
    
    if (configured) {
      supabaseUrl = trimmedUrl;
      supabaseAnonKey = trimmedKey;
      localStorage.setItem('camlease_supabase_url', supabaseUrl);
      localStorage.setItem('camlease_supabase_key', supabaseAnonKey);
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      isSupabaseConfigured = true;
      console.log('[Supabase] Config updated & client initialized.');
      return true;
    } else {
      supabaseUrl = '';
      supabaseAnonKey = '';
      localStorage.removeItem('camlease_supabase_url');
      localStorage.removeItem('camlease_supabase_key');
      supabase = null;
      isSupabaseConfigured = false;
      console.log('[Supabase] Config cleared & client reset.');
      return false;
    }
  } catch (err) {
    console.error('[Supabase] Error updating config:', err);
    return false;
  }
}

/**
 * Test connections by trying to query the 'camlease_store' table
 */
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!checkIsConfigured(url, key)) {
      return { success: false, message: 'Thông tin cấu hình không hợp lệ. URL phải bắt đầu bằng https://' };
    }
    
    const tempClient = createClient(url.trim(), key.trim());
    const { data, error } = await tempClient
      .from('camlease_store')
      .select('key')
      .limit(1);
      
    if (error) {
      // Check for table not existing error code or message
      if (
        error.code === 'PGRST116' || 
        error.message.includes('relation "public.camlease_store" does not exist') || 
        error.message.includes('does not exist')
      ) {
        return { 
          success: false, 
          message: 'Kết nối tới Supabase thành công, nhưng bảng "camlease_store" chưa được tạo. Vui lòng tạo bảng này.' 
        };
      }
      return { success: false, message: `Lỗi kết nối: ${error.message} (Code: ${error.code})` };
    }
    
    return { success: true, message: 'Kết nối thành công! Đã tìm thấy bảng camlease_store.' };
  } catch (err: any) {
    return { success: false, message: `Lỗi kết nối: ${err?.message || err}` };
  }
}

/**
 * Synchronize data state to Supabase cloud database
 * @param key LocalStorage matched key
 * @param data Array or Object data block to serialize
 * @returns Success status indicator
 */
export async function syncToSupabase(key: string, data: any): Promise<boolean> {
  if (!supabase) {
    console.warn(`[Supabase] Cannot sync "${key}": Client is not initialized.`);
    return false;
  }
  try {
    const { error } = await supabase
      .from('camlease_store')
      .upsert(
        { 
          key, 
          value: JSON.stringify(data), 
          updated_at: new Date().toISOString() 
        }, 
        { onConflict: 'key' }
      );
    
    if (error) {
      console.warn(`[Supabase] Sync failed for "${key}":`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] Exception syncing "${key}":`, err);
    return false;
  }
}

/**
 * Fetch synchronized data state from Supabase cloud database
 * @param key LocalStorage matched key
 * @returns Parsed JSON data or null if empty/unavailable
 */
export async function fetchFromSupabase(key: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('camlease_store')
      .select('value')
      .eq('key', key)
      .maybeSingle(); // Prevents throwing 406 on no records found
    
    if (error) {
      console.warn(`[Supabase] Fetch failed for "${key}":`, error.message);
      return null;
    }
    
    if (data && data.value) {
      return JSON.parse(data.value);
    }
  } catch (err) {
    console.error(`[Supabase] Exception fetching "${key}":`, err);
  }
  return null;
}
