import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Dynamic credential getters with localStorage fallback
function getStoredUrl(): string {
  if (typeof import.meta !== 'undefined') {
    if (import.meta.env?.VITE_SUPABASE_URL) return import.meta.env.VITE_SUPABASE_URL;
    if (import.meta.env?.SUPABASE_URL) return import.meta.env.SUPABASE_URL;
  }
  if (typeof process !== 'undefined') {
    if (process.env?.VITE_SUPABASE_URL) return process.env.VITE_SUPABASE_URL;
    if (process.env?.SUPABASE_URL) return process.env.SUPABASE_URL;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('som_supabase_url') || '';
  }
  return '';
}

function getStoredKey(): string {
  if (typeof import.meta !== 'undefined') {
    if (import.meta.env?.VITE_SUPABASE_ANON_KEY) return import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (import.meta.env?.SUPABASE_PUBLISHABLE_KEY) return import.meta.env.SUPABASE_PUBLISHABLE_KEY;
    if (import.meta.env?.SUPABASE_ANON_KEY) return import.meta.env.SUPABASE_ANON_KEY;
  }
  if (typeof process !== 'undefined') {
    if (process.env?.VITE_SUPABASE_ANON_KEY) return process.env.VITE_SUPABASE_ANON_KEY;
    if (process.env?.SUPABASE_PUBLISHABLE_KEY) return process.env.SUPABASE_PUBLISHABLE_KEY;
    if (process.env?.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('som_supabase_anon_key') || '';
  }
  return '';
}

let supabaseClient: SupabaseClient | null = null;
let currentClientKey = '';

/**
 * Returns the initialized Supabase client instance or null if credentials are not configured.
 * Lazy initialization prevents runtime crashes when keys are missing.
 */
export function getSupabase(): SupabaseClient | null {
  const url = getStoredUrl();
  const key = getStoredKey();

  if (!url || !key) {
    return null;
  }

  const clientKey = `${url}::${key}`;
  if (!supabaseClient || currentClientKey !== clientKey) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      currentClientKey = clientKey;
    } catch (error) {
      console.warn('Failed to initialize Supabase client:', error);
      return null;
    }
  }
  return supabaseClient;
}

/**
 * Save Supabase credentials to localStorage for runtime fallback usage.
 */
export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('som_supabase_url', url.trim());
    localStorage.setItem('som_supabase_anon_key', key.trim());
    // Reset cached client
    supabaseClient = null;
    currentClientKey = '';
  }
}

/**
 * Clear custom stored Supabase credentials.
 */
export function clearSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('som_supabase_url');
    localStorage.removeItem('som_supabase_anon_key');
    supabaseClient = null;
    currentClientKey = '';
  }
}

/**
 * Gets currently active Supabase configuration sources and values (masked for security).
 */
export function getSupabaseConfigStatus() {
  const url = getStoredUrl();
  const key = getStoredKey();
  const isEnv = Boolean(
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL)
  );

  return {
    url,
    keyMasked: key ? `${key.substring(0, 10)}...${key.substring(key.length - 6)}` : '',
    hasKey: Boolean(key),
    source: isEnv ? 'Environment Variable (.env)' : url ? 'Local Storage Settings' : 'Not Configured',
  };
}

/**
 * Checks if Supabase credentials are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(getStoredUrl() && getStoredKey());
}

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  message: string;
  error?: string;
}

/**
 * Verifies connection stability with Supabase before switching or dual-writing data.
 */
export async function verifySupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      isConnected: false,
      latencyMs: 0,
      message: 'Supabase URL หรือ Anon Key ยังไม่ได้ตั้งค่าใน environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      isConfigured: true,
      isConnected: false,
      latencyMs: 0,
      message: 'ไม่สามารถสร้าง Supabase Client ได้',
    };
  }

  const startTime = Date.now();
  try {
    // Ping Supabase auth/health endpoint or test query
    const { error } = await client.from('_health_check_').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - startTime;

    // Ignore missing table error ('42P01' or 'PGRST116') as proof that connection to Supabase endpoint succeeded
    if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
      return {
        isConfigured: true,
        isConnected: false,
        latencyMs,
        message: `เชื่อมต่อ Supabase ไม่สำเร็จ: ${error.message}`,
        error: error.message,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      latencyMs,
      message: `เชื่อมต่อ Supabase สำเร็จเรียบร้อย (Latency: ${latencyMs}ms)`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      isConfigured: true,
      isConnected: false,
      latencyMs,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Generates SQL DDL script to create all necessary tables in Supabase SQL Editor.
 */
export function getSupabaseSchemaDDL(): string {
  return `-- ============================================================
-- SOM (Solar & Operations Management) Supabase Schema DDL
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' | 'expense'
  amount NUMERIC NOT NULL DEFAULT 0,
  title TEXT,
  category TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  payment_method TEXT,
  customer_id TEXT,
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  customer_name TEXT,
  date TEXT NOT NULL,
  time TEXT,
  status TEXT DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Warranties Table
CREATE TABLE IF NOT EXISTS public.warranties (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  serial_number TEXT,
  customer_name TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Quick Notes Table
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  color TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security) with open public access policies for development
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON public.transactions FOR UPDATE USING (true);

CREATE POLICY "Public Read Access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.customers FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.warranties FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.warranties FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Access" ON public.quick_notes FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.quick_notes FOR INSERT WITH CHECK (true);
`;
}

/**
 * Interface mapping Firebase collections to Supabase tables for migration reference.
 */
export const FIREBASE_TO_SUPABASE_TABLE_MAPPING = {
  transactions: 'transactions',
  customers: 'customers',
  appointments: 'appointments',
  warranties: 'warranties',
  quick_notes: 'quick_notes',
  users: 'users',
  audit_logs: 'audit_logs',
  category_budgets: 'category_budgets',
  recurring_transactions: 'recurring_transactions',
} as const;
