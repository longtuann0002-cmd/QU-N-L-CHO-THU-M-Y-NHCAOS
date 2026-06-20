/**
 * db.ts — Lớp truy cập dữ liệu Supabase
 * Thay thế loadStoredData / saveStoredData từ localStorage.
 * Nếu Supabase chưa cấu hình, tự động fallback về localStorage.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Camera, RentalContract, Customer, Expense } from '../types';
import {
  INITIAL_CAMERAS,
  INITIAL_CUSTOMERS,
  INITIAL_CONTRACTS,
  INITIAL_EXPENSES,
  loadStoredData,
  saveStoredData,
} from '../utils/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localLoad<T>(key: string, def: T): T {
  return loadStoredData(key, def);
}

function localSave<T>(key: string, data: T): void {
  saveStoredData(key, data);
}

// ─── Cameras ──────────────────────────────────────────────────────────────────

/** Map row từ Supabase (snake_case) → Camera (camelCase) */
function rowToCamera(row: any): Camera {
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

/** Map Camera (camelCase) → row Supabase (snake_case) */
function cameraToRow(cam: Camera) {
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

export async function fetchCameras(): Promise<Camera[]> {
  if (!isSupabaseConfigured()) {
    return localLoad('cameras', INITIAL_CAMERAS);
  }
  const { data, error } = await supabase.from('cameras').select('*').order('name');
  if (error) {
    console.error('[db] fetchCameras error:', error.message);
    return localLoad('cameras', INITIAL_CAMERAS);
  }
  // Nếu bảng trống, seed dữ liệu mẫu
  if (!data || data.length === 0) {
    await seedCameras(INITIAL_CAMERAS);
    return INITIAL_CAMERAS;
  }
  return data.map(rowToCamera);
}

export async function upsertCamera(cam: Camera): Promise<void> {
  if (!isSupabaseConfigured()) {
    // fallback: cập nhật localStorage (xử lý ở App.tsx vẫn dùng state)
    return;
  }
  const { error } = await supabase.from('cameras').upsert(cameraToRow(cam));
  if (error) console.error('[db] upsertCamera error:', error.message);
}

export async function upsertCameras(cameras: Camera[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const rows = cameras.map(cameraToRow);
  const { error } = await supabase.from('cameras').upsert(rows);
  if (error) console.error('[db] upsertCameras error:', error.message);
}

export async function deleteCamera(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('cameras').delete().eq('id', id);
  if (error) console.error('[db] deleteCamera error:', error.message);
}

async function seedCameras(cameras: Camera[]): Promise<void> {
  const { error } = await supabase.from('cameras').insert(cameras.map(cameraToRow));
  if (error) console.error('[db] seedCameras error:', error.message);
}

// ─── Customers ────────────────────────────────────────────────────────────────

function rowToCustomer(row: any): Customer {
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

function customerToRow(c: Customer) {
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

export async function fetchCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured()) {
    return localLoad('customers', INITIAL_CUSTOMERS);
  }
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) {
    console.error('[db] fetchCustomers error:', error.message);
    return localLoad('customers', INITIAL_CUSTOMERS);
  }
  if (!data || data.length === 0) {
    await seedCustomers(INITIAL_CUSTOMERS);
    return INITIAL_CUSTOMERS;
  }
  return data.map(rowToCustomer);
}

export async function upsertCustomer(c: Customer): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('customers').upsert(customerToRow(c));
  if (error) console.error('[db] upsertCustomer error:', error.message);
}

export async function upsertCustomers(customers: Customer[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('customers').upsert(customers.map(customerToRow));
  if (error) console.error('[db] upsertCustomers error:', error.message);
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) console.error('[db] deleteCustomer error:', error.message);
}

async function seedCustomers(customers: Customer[]): Promise<void> {
  const { error } = await supabase.from('customers').insert(customers.map(customerToRow));
  if (error) console.error('[db] seedCustomers error:', error.message);
}

// ─── Contracts ────────────────────────────────────────────────────────────────

function rowToContract(row: any): RentalContract {
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

function contractToRow(c: RentalContract) {
  return {
    id: c.id,
    contract_code: c.contractCode,
    customer_id: c.customerId,
    customer_name: c.customerName,
    customer_phone: c.customerPhone,
    customer_doc_type: c.customerDocType,
    customer_doc_note: c.customerDocNote ?? null,
    items: c.items,
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

export async function fetchContracts(): Promise<RentalContract[]> {
  if (!isSupabaseConfigured()) {
    return localLoad('contracts', INITIAL_CONTRACTS);
  }
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[db] fetchContracts error:', error.message);
    return localLoad('contracts', INITIAL_CONTRACTS);
  }
  if (!data || data.length === 0) {
    await seedContracts(INITIAL_CONTRACTS);
    return INITIAL_CONTRACTS;
  }
  return data.map(rowToContract);
}

export async function upsertContract(c: RentalContract): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('contracts').upsert(contractToRow(c));
  if (error) console.error('[db] upsertContract error:', error.message);
}

export async function upsertContracts(contracts: RentalContract[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('contracts').upsert(contracts.map(contractToRow));
  if (error) console.error('[db] upsertContracts error:', error.message);
}

export async function deleteContract(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) console.error('[db] deleteContract error:', error.message);
}

async function seedContracts(contracts: RentalContract[]): Promise<void> {
  const { error } = await supabase.from('contracts').insert(contracts.map(contractToRow));
  if (error) console.error('[db] seedContracts error:', error.message);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category,
    operator: row.operator,
  };
}

function expenseToRow(e: Expense) {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    date: e.date,
    category: e.category,
    operator: e.operator,
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  if (!isSupabaseConfigured()) {
    return localLoad('expenses', INITIAL_EXPENSES);
  }
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  if (error) {
    console.error('[db] fetchExpenses error:', error.message);
    return localLoad('expenses', INITIAL_EXPENSES);
  }
  if (!data || data.length === 0) {
    await seedExpenses(INITIAL_EXPENSES);
    return INITIAL_EXPENSES;
  }
  return data.map(rowToExpense);
}

export async function upsertExpense(e: Expense): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('expenses').upsert(expenseToRow(e));
  if (error) console.error('[db] upsertExpense error:', error.message);
}

export async function upsertExpenses(expenses: Expense[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('expenses').upsert(expenses.map(expenseToRow));
  if (error) console.error('[db] upsertExpenses error:', error.message);
}

export async function deleteExpense(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) console.error('[db] deleteExpense error:', error.message);
}

async function seedExpenses(expenses: Expense[]): Promise<void> {
  const { error } = await supabase.from('expenses').insert(expenses.map(expenseToRow));
  if (error) console.error('[db] seedExpenses error:', error.message);
}

// ─── Settings (Đồng bộ đồng thời LocalStorage & Supabase) ────────────────────

export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  if (!isSupabaseConfigured()) {
    return localLoad(key, defaultValue);
  }
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
    if (error || !data) {
      // Nếu chưa có trên Supabase, lấy từ localStorage làm fallback và đồng bộ lên
      const val = localLoad(key, defaultValue);
      await saveSetting(key, val);
      return val;
    }
    return data.value as T;
  } catch (err) {
    console.error(`[db] loadSetting error for ${key}:`, err);
    return localLoad(key, defaultValue);
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  localSave(key, value);
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase.from('settings').upsert({ key, value });
    if (error) console.error(`[db] saveSetting error for ${key}:`, error.message);
  } catch (err) {
    console.error(`[db] saveSetting error for ${key}:`, err);
  }
}

