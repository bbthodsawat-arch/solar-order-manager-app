import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import Login from '../pages/Login';

const required = import.meta.env.VITE_SUPABASE_AUTH_REQUIRED === 'true';

export default function SupabaseAuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, configured } = useSupabaseAuth();

  // Safe rollout: Firebase remains the existing application auth until Supabase
  // identities have been provisioned. Set this flag to true only after migration.
  if (!required) return <>{children}</>;

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
          <ShieldCheck className="mx-auto mb-4 text-rose-500" size={40} />
          <h1 className="text-xl font-black text-slate-900 dark:text-white">ยังไม่ได้ตั้งค่า Supabase Auth</h1>
          <p className="mt-2 text-sm text-slate-500">กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ก่อนเปิดโหมดบังคับใช้</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-500">กำลังตรวจสอบ Supabase session...</div>;
  }

  if (!session) return <Login />;
  return <>{children}</>;
}
