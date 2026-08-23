import type { PermissionKey } from './permissions';
import type { CommandDomainId } from './domains';

export type CommandWorkspaceStatus = 'native' | 'legacy' | 'planned';
export interface CommandDefinition { id:string; domain:CommandDomainId; title:string; description:string; keywords:string[]; permission?:PermissionKey; legacySection?:string; danger?:boolean; quickAction?:boolean; workspaceStatus?:CommandWorkspaceStatus; }
export interface RegistryHealth { status:'healthy'|'degraded'; totalCommands:number; duplicateIds:string[]; invalidDomains:string[]; missingWorkspaceStatus:string[]; }

export const COMMAND_REGISTRY: CommandDefinition[] = [
 {id:'business.profile',domain:'business',title:'ข้อมูลธุรกิจ',description:'ข้อมูลกิจการ ที่อยู่ และค่าพื้นฐานของธุรกิจ',keywords:['business','company','profile','บริษัท','ธุรกิจ'],permission:'canManageSettings',legacySection:'business',quickAction:true,workspaceStatus:'native'},
 {id:'business.brand',domain:'business',title:'แบรนด์และการชำระเงิน',description:'โลโก้ บัญชีรับเงิน ลายเซ็น และข้อมูลแบรนด์',keywords:['brand','branding','payment','bank','logo','ชำระเงิน','แบรนด์'],permission:'canManageSettings',legacySection:'branding',quickAction:true,workspaceStatus:'native'},
 {id:'business.documents',domain:'business',title:'Document Center',description:'Template, เลขที่เอกสาร Workflow และคลังเอกสาร',keywords:['document','template','numbering','workflow','archive','เอกสาร','เลขที่เอกสาร'],permission:'canManageSettings',legacySection:'documents',quickAction:true,workspaceStatus:'native'},
 {id:'business.configuration',domain:'business',title:'หมวดหมู่ การชำระเงิน และแท็ก',description:'ค่ามาตรฐานสำหรับรายรับ รายจ่าย และการชำระเงิน',keywords:['payment','category','tag','ชำระเงิน','หมวดหมู่'],permission:'canManageSettings',legacySection:'configuration',workspaceStatus:'legacy'},
 {id:'catalog.products',domain:'catalog',title:'ชุดสินค้าและราคา',description:'ชุดมาตรฐาน ราคา และสินค้า',keywords:['product','catalog','price','สินค้า','ราคา'],permission:'canManageInventory',legacySection:'catalog',quickAction:true,workspaceStatus:'native'},
 {id:'catalog.inventory',domain:'catalog',title:'สินค้าและสต็อก',description:'สินค้า คลัง และจำนวนคงเหลือ',keywords:['inventory','stock','สต็อก','คลัง'],permission:'canManageInventory',legacySection:'inventory',quickAction:true,workspaceStatus:'native'},
 {id:'catalog.assets',domain:'catalog',title:'ทรัพย์สินและค่าเสื่อม',description:'อุปกรณ์และทรัพย์สิน',keywords:['asset','depreciation','ทรัพย์สิน'],permission:'canManageInventory',legacySection:'assets',workspaceStatus:'legacy'},
 {id:'experience.design',domain:'experience',title:'ดีไซน์ แดชบอร์ด และเมนู',description:'ธีม ระบบดีไซน์ การ์ด วิดเจ็ต และ Navigation',keywords:['theme','design','dashboard','widget','ธีม','ดีไซน์'],permission:'canManageSettings',legacySection:'experience',quickAction:true,workspaceStatus:'native'},
 {id:'automation.workflows',domain:'automation',title:'การแจ้งเตือนและงานอัตโนมัติ',description:'เตือนประจำวันและรายการที่เกิดซ้ำ',keywords:['automation','reminder','recurring','แจ้งเตือน'],permission:'canManageSettings',legacySection:'automation',quickAction:true,workspaceStatus:'native'},
 {id:'security.access',domain:'security',title:'ความปลอดภัยและการเข้าถึง',description:'PIN ผู้ใช้ สิทธิ์ และ Audit Log',keywords:['security','users','roles','audit','สิทธิ์'],permission:'canManageSecurity',legacySection:'security',quickAction:true,workspaceStatus:'native'},
 {id:'security.login',domain:'security',title:'การเข้าสู่ระบบ',description:'Google อีเมล รหัสผ่าน และหน้า Login',keywords:['login','authentication','google','password','ล็อกอิน'],permission:'canManageSecurity',legacySection:'login',workspaceStatus:'native'},
 {id:'system.data',domain:'system',title:'ข้อมูล สำรอง และสุขภาพระบบ',description:'ฐานข้อมูล Cloud Sync และ Backup',keywords:['database','backup','sync','health','สำรอง','ซิงค์'],permission:'canManageDatabase',legacySection:'data',quickAction:true,workspaceStatus:'native'},
 {id:'system.maintenance',domain:'system',title:'เครื่องมือระบบขั้นสูง',description:'การบำรุงรักษาและ Factory Reset',keywords:['system','maintenance','factory reset','รีเซ็ต'],permission:'system.reset',legacySection:'system',danger:true,workspaceStatus:'native'},
];
export function getCommand(id:string){return COMMAND_REGISTRY.find(command=>command.id===id);}
export function getRegistryHealth(commands:readonly CommandDefinition[]=COMMAND_REGISTRY):RegistryHealth{
 const knownDomains=new Set<CommandDomainId>(['business','catalog','experience','automation','security','system']); const counts=new Map<string,number>();
 for(const command of commands) counts.set(command.id,(counts.get(command.id)??0)+1);
 const duplicateIds=[...counts.entries()].filter(([,count])=>count>1).map(([id])=>id).sort();
 const invalidDomains=[...new Set(commands.filter(command=>!knownDomains.has(command.domain)).map(command=>command.id))].sort();
 const missingWorkspaceStatus=commands.filter(command=>!command.workspaceStatus).map(command=>command.id).sort();
 return {status:duplicateIds.length||invalidDomains.length||missingWorkspaceStatus.length?'degraded':'healthy',totalCommands:commands.length,duplicateIds,invalidDomains,missingWorkspaceStatus};
}
