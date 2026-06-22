import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: 'C:/Users/Admin/Documents/GitHub/QU-N-L-CHO-THU-M-Y-NHCAOS/.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key length:', supabaseAnonKey.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchFromSupabase(key) {
  try {
    const { data, error } = await supabase
      .from('camlease_store')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
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

async function test() {
  const keys = ['cameras', 'contracts', 'customers', 'expenses', 'registeredUsers', 'camlease_snapshots'];
  for (const key of keys) {
    const data = await fetchFromSupabase(key);
    console.log(`Key: ${key}, exists: ${data !== null}, length/type: ${data ? (Array.isArray(data) ? data.length + ' items' : typeof data) : 'null'}`);
  }
}

test();
