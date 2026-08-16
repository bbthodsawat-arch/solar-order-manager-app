import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Globe, 
  Activity, 
  Copy, 
  Check, 
  Trash2, 
  Save, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../utils/feedback';
import { 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  getSupabaseConfigStatus, 
  verifySupabaseConnection, 
  getSupabaseSchemaDDL,
  SupabaseHealthCheckResult
} from '../lib/supabase';

export const SupabaseConfigManager: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState(getSupabaseConfigStatus());
  const [health, setHealth] = useState<SupabaseHealthCheckResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCopiedSQL, setIsCopiedSQL] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'status'>('config');

  useEffect(() => {
    const s = getSupabaseConfigStatus();
    setStatus(s);
    setUrlInput(s.url);
  }, []);

  const handleTestConnection = async () => {
    soundFeedback.click();
    setIsVerifying(true);
    setHealth(null);

    const result = await verifySupabaseConnection();
    setHealth(result);
    setIsVerifying(false);

    if (result.isConnected) {
      toast.success(result.message, { icon: '⚡' });
    } else {
      toast.error(result.message);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      toast.error('กรุณาระบุทั้ง Supabase URL และ Anon Key');
      return;
    }

    soundFeedback.click();
    saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    const updatedStatus = getSupabaseConfigStatus();
    setStatus(updatedStatus);
    setKeyInput('');
    toast.success('บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว!');

    // Automatically trigger health check
    handleTestConnection();
  };

  const handleClearConfig = () => {
    soundFeedback.click();
    if (confirm('ต้องการลบการตั้งค่า Supabase ที่บันทึกไว้ออกหรือไม่?')) {
      clearSupabaseConfig();
      const updatedStatus = getSupabaseConfigStatus();
      setStatus(updatedStatus);
      setUrlInput('');
      setKeyInput('');
      setHealth(null);
      toast.success('ลบการตั้งค่า Supabase เรียบร้อยแล้ว');
    }
  };

  const handleCopySQL = () => {
    soundFeedback.click();
    const ddl = getSupabaseSchemaDDL();
    navigator.clipboard.writeText(ddl);
    setIsCopiedSQL(true);
    toast.success('คัดลอก SQL DDL Schema เรียบร้อยแล้ว! สามารถนำไปวางใน Supabase SQL Editor');
    setTimeout(() => setIsCopiedSQL(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white relative overflow-hidden shadow-lg border border-emerald-900/40">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <Database size={14} className="text-emerald-400" />
              <span>SUPABASE FAILOVER & BACKUP DATA LAYER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ตั้งค่าฐานข้อมูล Supabase (Secondary Data Layer)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              เชื่อมต่อกับฐานข้อมูล PostgreSQL ของคุณบน Supabase เพื่อสำรองข้อมูล ป้องกันปัญหาโควต้า และรักษาสเถียรภาพการบันทึกข้อมูลอย่างต่อเนื่อง
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 shadow-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>ไปที่ Supabase Dashboard</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
        <button
          onClick={() => {
            soundFeedback.click();
            setActiveTab('config');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key size={15} className={activeTab === 'config' ? 'text-emerald-500' : ''} />
          <span>1. กำหนดการตั้งค่า Credentials</span>
        </button>

        <button
          onClick={() => {
            soundFeedback.click();
            setActiveTab('sql');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sql'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Terminal size={15} className={activeTab === 'sql' ? 'text-emerald-500' : ''} />
          <span>2. โครงสร้างตาราง (SQL DDL Script)</span>
        </button>

        <button
          onClick={() => {
            soundFeedback.click();
            setActiveTab('status');
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'status'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity size={15} className={activeTab === 'status' ? 'text-emerald-500' : ''} />
          <span>3. ตรวจสอบสัญญาณ & Diagnostics</span>
        </button>
      </div>

      {/* Tab 1: Credentials Form */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ตั้งค่า Supabase URL & API Key
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  นำค่า Project URL และ anon public key จาก Supabase Settings {'>'} API มาวางตรงนี้
                </p>
              </div>
            </div>

            {status.hasKey && (
              <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 size={14} />
                <span>มีการตั้งค่าแล้ว ({status.source})</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Supabase Project URL *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full text-xs p-3.5 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-900 dark:text-white font-medium"
                />
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Supabase Anon / Public Key *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required={!status.hasKey}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={status.hasKey ? `คีย์ปัจจุบัน: ${status.keyMasked} (พิมพ์ใหม่เมื่อต้องการเปลี่ยน)` : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
                  className="w-full text-xs p-3.5 pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-900 dark:text-white font-medium"
                />
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>บันทึกการตั้งค่า</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isVerifying}
                  className="px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-black shadow-sm active:scale-95 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isVerifying ? 'animate-spin' : ''} />
                  <span>{isVerifying ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                </button>
              </div>

              {status.hasKey && (
                <button
                  type="button"
                  onClick={handleClearConfig}
                  className="px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>ลบการตั้งค่า</span>
                </button>
              )}
            </div>
          </form>

          {/* Quick Setup Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>วิธีรับ Supabase Credentials:</span>
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium leading-relaxed pl-1">
              <li>สร้างโปรเจกต์ใหม่ฟรีที่ <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">supabase.com</a></li>
              <li>ไปที่เมนู <strong>Project Settings</strong> {'>'} <strong>API</strong></li>
              <li>คัดลอก <strong>Project URL</strong> และ <strong>anon public key</strong> มาวางในช่องด้านบน</li>
              <li>สลับไปที่แท็บ <strong>"2. โครงสร้างตาราง (SQL DDL Script)"</strong> เพื่อคัดลอกคำสั่งสร้างตารางใน Supabase SQL Editor</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 2: SQL DDL Script */}
      {activeTab === 'sql' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  คำสั่งสร้างตาราง SQL (SQL DDL Script)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  คัดลอกโค้ด SQL ด้านล่างไปวางใน Supabase Dashboard {'>'} SQL Editor แล้วกด Run
                </p>
              </div>
            </div>

            <button
              onClick={handleCopySQL}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm active:scale-95 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              {isCopiedSQL ? <Check size={16} /> : <Copy size={16} />}
              <span>{isCopiedSQL ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด SQL ทั้งหมด'}</span>
            </button>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 p-4 border border-slate-800">
            <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2 leading-relaxed max-h-96">
              {getSupabaseSchemaDDL()}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Diagnostics & Ping */}
      {activeTab === 'status' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-2xl">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ผลการตรวจเช็กและทดสอบการเชื่อมต่อ
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ตรวจสอบ Latency ความเร็ว และการเชื่อมต่อแบบเรียลไทม์
                </p>
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm active:scale-95 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={isVerifying ? 'animate-spin' : ''} />
              <span>รันการทดสอบสัญญาณ</span>
            </button>
          </div>

          {health ? (
            <div className={`p-5 rounded-3xl border-2 space-y-3 ${
              health.isConnected 
                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500/40 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-black text-sm">
                  {health.isConnected ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-rose-500" />}
                  <span>{health.isConnected ? 'เชื่อมต่อ Supabase สำเร็จเรียบร้อย' : 'ไม่สามารถเชื่อมต่อ Supabase ได้'}</span>
                </div>
                {health.isConnected && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    Latency: {health.latencyMs} ms
                  </span>
                )}
              </div>
              <p className="text-xs font-medium leading-relaxed">{health.message}</p>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <ShieldCheck size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-500">
                กดปุ่ม "รันการทดสอบสัญญาณ" ด้านบนเพื่อตรวจสอบการเชื่อมต่อกับ Supabase
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
