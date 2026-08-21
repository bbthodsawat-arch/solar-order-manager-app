import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, createNewUserWithPassword, sendUserPasswordResetEmail } from '../lib/firebase';
import { AppUser, UserPermissions, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_ROLE_PERMISSIONS, getUserPermissions, PERMISSION_LABELS } from '../utils/permissions';
import { logAuditEvent } from '../lib/auditLogger';
import { toast } from 'react-hot-toast';
import { Check, Copy, Eye, EyeOff, KeyRound, Plus, RefreshCw, Search, ShieldCheck, UserCog, UserPlus, UserX, X } from 'lucide-react';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';
const ROLE_META: Record<UserRole, { label: string; desc: string }> = {
  admin: { label: 'Admin', desc: 'ควบคุมระบบ ผู้ใช้ ความปลอดภัย และข้อมูลทั้งหมด' },
  owner: { label: 'Owner', desc: 'เจ้าของระบบและสิทธิ์ทั้งหมด' },
  manager: { label: 'Manager', desc: 'ดูแลการขาย ลูกค้า สต็อก และรายงาน' },
  staff: { label: 'Staff', desc: 'ทำงานประจำวันและจัดการรายการที่ได้รับมอบหมาย' },
  viewer: { label: 'Viewer', desc: 'ดูข้อมูลและรายงานแบบอ่านอย่างเดียว' },
};

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let value = 'Solar#';
  for (let i = 0; i < 10; i++) value += chars[Math.floor(Math.random() * chars.length)];
  return value;
}
