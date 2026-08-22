import type { PermissionKey } from './permissions';
import type { CommandDomainId } from './domains';

export interface CommandDefinition {
  id: string;
  domain: CommandDomainId;
  title: string;
  description: string;
  keywords: string[];
  permission?: PermissionKey;
  legacySection?: string;
  danger?: boolean;
  quickAction?: boolean;
}

export const COMMAND_REGISTRY: CommandDefinition[] = [
  { id:'business.profile', domain:'business', title:'ข้อมูลธุรกิจและเอกสาร', description:'ข้อมูลกิจการ เอกสาร เลขที่ และแบรนด์', keywords:['business','company','document','brand','เอกสาร','บริษัท','แบรนด์'], permission:'canManageSettings', legacySection:'business', quickAction:true },
  { id:'business.configuration', domain:'business', title:'หมวดหมู่ การชำระเงิน และแท็ก', description:'ค่ามาตรฐานสำหรับรายรับ รายจ่าย และการชำระเงิน', keywords:['payment','category','tag','ชำระเงิน','หมวดหมู่'], permission:'canManageSettings', legacySection:'configuration' },
  { id:'catalog.products', domain:'catalog', title:'ชุดสินค้าและราคา', description:'ชุดมาตรฐาน ราคา และสินค้า', keywords:['product','catalog','price','สินค้า','ราคา'], permission:'canManageInventory', legacySection:'catalog', quickAction:true },
  { id:'catalog.inventory', domain:'catalog', title:'สินค้าและสต็อก', description:'สินค้า คลัง และจำนวนคงเหลือ', keywords:['inventory','stock','สต็อก','คลัง'], permission:'canManageInventory', legacySection:'inventory' },
  { id:'catalog.assets', domain:'catalog', title:'ทรัพย์สินและค่าเสื่อม', description:'อุปกรณ์และทรัพย์สิน', keywords:['asset','depreciation','ทรัพย์สิน'], permission:'canManageInventory', legacySection:'assets' },
  { id:'experience.design', domain:'experience', title:'ดีไซน์ แดชบอร์ด และเมนู', description:'ธีม ระบบดีไซน์ การ์ด วิดเจ็ต และ Navigation', keywords:['theme','design','dashboard','widget','ธีม','ดีไซน์'], permission:'canManageSettings', legacySection:'experience', quickAction:true },
  { id:'automation.workflows', domain:'automation', title:'การแจ้งเตือนและงานอัตโนมัติ', description:'เตือนประจำวันและรายการที่เกิดซ้ำ', keywords:['automation','reminder','recurring','แจ้งเตือน'], permission:'canManageSettings', legacySection:'automation' },
  { id:'security.access', domain:'security', title:'ความปลอดภัยและการเข้าถึง', description:'PIN ผู้ใช้ สิทธิ์ และ Audit Log', keywords:['security','users','roles','audit','สิทธิ์'], permission:'canManageSecurity', legacySection:'security' },
  { id:'security.login', domain:'security', title:'การเข้าสู่ระบบ', description:'Google อีเมล รหัสผ่าน และหน้า Login', keywords:['login','authentication','google','password','ล็อกอิน'], permission:'canManageSecurity', legacySection:'login' },
  { id:'system.data', domain:'system', title:'ข้อมูล สำรอง และสุขภาพระบบ', description:'ฐานข้อมูล Cloud Sync และ Backup', keywords:['database','backup','sync','health','สำรอง','ซิงค์'], permission:'canManageDatabase', legacySection:'data', quickAction:true },
  { id:'system.maintenance', domain:'system', title:'เครื่องมือระบบขั้นสูง', description:'การบำรุงรักษาและ Factory Reset', keywords:['system','maintenance','factory reset','รีเซ็ต'], permission:'system.reset', legacySection:'system', danger:true },
];

export function getCommand(id: string) { return COMMAND_REGISTRY.find(command => command.id === id); }
