import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  !supabaseUrl.toLowerCase().includes('placeholder') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper mapping functions
function rowToCamera(row: any) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    category: row.category,
    dailyRate: row.daily_rate,
    price6Hours: row.price_6hours ?? undefined,
    price1Day: row.price_1day ?? undefined,
    price2Days: row.price_2days ?? undefined,
    price3Days: row.price_3days ?? undefined,
    price4DaysPlus: row.price_4days_plus ?? undefined,
    status: row.status,
    serialNumber: row.serial_number,
    image: row.image ?? undefined,
    description: row.description ?? undefined,
  };
}

function cameraToRow(cam: any) {
  return {
    id: cam.id,
    name: cam.name,
    short_name: cam.shortName,
    category: cam.category,
    daily_rate: cam.dailyRate,
    price_6hours: cam.price6Hours ?? null,
    price_1day: cam.price1Day ?? null,
    price_2days: cam.price2Days ?? null,
    price_3days: cam.price3Days ?? null,
    price_4days_plus: cam.price4DaysPlus ?? null,
    status: cam.status,
    serial_number: cam.serialNumber,
    image: cam.image ?? null,
    description: cam.description ?? null,
  };
}

function rowToCustomer(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    idNumber: row.id_number ?? undefined,
    trustLevel: row.trust_level,
    rentalCount: row.rental_count,
    notes: row.notes ?? undefined,
  };
}

function customerToRow(c: any) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? null,
    address: c.address ?? null,
    id_number: c.idNumber ?? null,
    trust_level: c.trustLevel,
    rental_count: c.rentalCount,
    notes: c.notes ?? null,
  };
}

function rowToContract(row: any) {
  return {
    id: row.id,
    contractCode: row.contract_code,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerDocType: row.customer_doc_type,
    customerDocNote: row.customer_doc_note ?? undefined,
    items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]'),
    startDate: row.start_date,
    endDate: row.end_date,
    is6Hours: row.is_6hours ?? undefined,
    returnTime: row.return_time ?? undefined,
    totalPrice: row.total_price,
    paidAmount: row.paid_amount,
    depositAmount: row.deposit_amount,
    status: row.status,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

function contractToRow(c: any) {
  return {
    id: c.id,
    contract_code: c.contractCode,
    customer_id: c.customerId,
    customer_name: c.customerName,
    customer_phone: c.customerPhone,
    customer_doc_type: c.customerDocType,
    customer_doc_note: c.customerDocNote ?? null,
    items: typeof c.items === 'string' ? c.items : JSON.stringify(c.items),
    start_date: c.startDate,
    end_date: c.endDate,
    is_6hours: c.is6Hours ?? false,
    return_time: c.returnTime ?? null,
    total_price: c.totalPrice,
    paid_amount: c.paidAmount,
    deposit_amount: c.depositAmount,
    status: c.status,
    note: c.note ?? null,
    created_at: c.createdAt,
  };
}

function rowToExpense(row: any) {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category,
    operator: row.operator,
  };
}

function expenseToRow(e: any) {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    category: e.category,
    operator: e.operator,
  };
}

export async function syncToSupabase(key: string, data: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    let resError: any = null;

    if (key === 'cameras') {
      const rows = data.map(cameraToRow);
      // Delete missing items
      const newIds = data.map((c: any) => c.id);
      const { data: existing } = await supabase.from('cameras').select('id');
      const idsToDelete = (existing || []).map(r => r.id).filter(id => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('cameras').delete().in('id', idsToDelete);
      }
      const { error } = await supabase.from('cameras').upsert(rows);
      resError = error;
    } else if (key === 'contracts') {
      const rows = data.map(contractToRow);
      // Delete missing items
      const newIds = data.map((c: any) => c.id);
      const { data: existing } = await supabase.from('contracts').select('id');
      const idsToDelete = (existing || []).map(r => r.id).filter(id => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('contracts').delete().in('id', idsToDelete);
      }
      const { error } = await supabase.from('contracts').upsert(rows);
      resError = error;
    } else if (key === 'customers') {
      const rows = data.map(customerToRow);
      // Delete missing items
      const newIds = data.map((c: any) => c.id);
      const { data: existing } = await supabase.from('customers').select('id');
      const idsToDelete = (existing || []).map(r => r.id).filter(id => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('customers').delete().in('id', idsToDelete);
      }
      const { error } = await supabase.from('customers').upsert(rows);
      resError = error;
    } else if (key === 'expenses') {
      const rows = data.map(expenseToRow);
      // Delete missing items
      const newIds = data.map((c: any) => c.id);
      const { data: existing } = await supabase.from('expenses').select('id');
      const idsToDelete = (existing || []).map(r => r.id).filter(id => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('expenses').delete().in('id', idsToDelete);
      }
      const { error } = await supabase.from('expenses').upsert(rows);
      resError = error;
    } else {
      // Fallback for settings (registeredUsers, logo parameters, etc.)
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value: typeof data === 'string' ? data : JSON.stringify(data) }, { onConflict: 'key' });
      resError = error;
    }

    if (resError) {
      console.warn(`[Supabase] Sync failed for "${key}":`, resError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Supabase] Exception syncing "${key}":`, err);
    return false;
  }
}

export async function fetchFromSupabase(key: string): Promise<any | null> {
  if (!supabase) return null;
  try {
    if (key === 'cameras') {
      const { data, error } = await supabase.from('cameras').select('*');
      if (error) throw error;
      return (data || []).map(rowToCamera);
    } else if (key === 'contracts') {
      const { data, error } = await supabase.from('contracts').select('*');
      if (error) throw error;
      return (data || []).map(rowToContract);
    } else if (key === 'customers') {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return (data || []).map(rowToCustomer);
    } else if (key === 'expenses') {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) throw error;
      return (data || []).map(rowToExpense);
    } else {
      // Settings fallback
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      if (data && data.value) {
        const valStr = data.value;
        try {
          return JSON.parse(valStr);
        } catch {
          return valStr;
        }
      }
    }
  } catch (err: any) {
    console.error(`[Supabase] Exception fetching "${key}":`, err.message || err);
  }
  return null;
}
