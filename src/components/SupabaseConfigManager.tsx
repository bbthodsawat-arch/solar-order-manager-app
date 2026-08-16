import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

/**
 * Supabase is intentionally disabled for SOM. Firebase Authentication and
 * Firestore remain the only supported cloud data path.
 *
 * This compatibility component is kept so existing imports do not break while
 * the legacy Supabase settings surface is retired from the product UI.
 */
export const SupabaseConfigManager: React.FC = () => (
  <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
    <div className="flex items-start gap-4">
      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <Database size={22} />
      </div>
      <div>
        <h2 className="font-black text-slate-900 dark:text-white">Firebase Firestore</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          SOM ใช้ Firebase Authentication + Firestore เป็นระบบฐานข้อมูลหลักเพียงระบบเดียว
          และปิดการเชื่อมต่อ Supabase แล้ว
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={16} />
          Firebase-only database policy active
        </div>
      </div>
    </div>
  </section>
);

export default SupabaseConfigManager;
