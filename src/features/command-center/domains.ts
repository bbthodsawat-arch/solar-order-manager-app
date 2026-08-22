export type CommandDomainId = 'business' | 'catalog' | 'experience' | 'automation' | 'security' | 'system';

export interface CommandDomain {
  id: CommandDomainId;
  title: string;
  description: string;
}

export const COMMAND_DOMAINS: CommandDomain[] = [
  { id: 'business', title: 'ธุรกิจ', description: 'ข้อมูลกิจการ แบรนด์ การชำระเงิน และเอกสาร' },
  { id: 'catalog', title: 'สินค้าและการดำเนินงาน', description: 'สินค้า สต็อก ราคา และทรัพย์สิน' },
  { id: 'experience', title: 'ประสบการณ์ใช้งาน', description: 'ธีม แดชบอร์ด เมนู และ POS' },
  { id: 'automation', title: 'ระบบอัตโนมัติ', description: 'รายการประจำ การแจ้งเตือน และงานอัตโนมัติ' },
  { id: 'security', title: 'ความปลอดภัยและสิทธิ์', description: 'ผู้ใช้ การเข้าถึง และ Audit Log' },
  { id: 'system', title: 'ระบบและข้อมูล', description: 'สุขภาพระบบ ซิงค์ สำรอง และการบำรุงรักษา' },
];
