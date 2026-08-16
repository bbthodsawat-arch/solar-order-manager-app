export const suggestCategory = (detail: string, type: 'income' | 'expense'): string | null => {
  if (!detail) return null;
  const lowerDetail = detail.toLowerCase();

  if (type === 'expense') {
    const expenseRules: { keywords: string[]; category: string }[] = [
      { keywords: ['โฆษณา', 'แอด', 'fb', 'google', 'ads', 'ยิงแอด', 'facebook'], category: 'ค่าโฆษณา' },
      { keywords: ['ข้าว', 'อาหาร', 'กิน', 'ส้มตำ', 'mk', 'kfc', 'เตี๋ยว', 'บุฟเฟต์', 'หมูกระทะ', 'เลี้ยง'], category: 'ค่าอาหาร' },
      { keywords: ['เหล้า', 'เบียร์', 'ช้าง', 'สิงห์', 'ลีโอ', 'เครื่องดื่ม', 'น้ำอัดลม', 'กาแฟ', 'ชา', 'cafe', 'คาเฟ่'], category: 'ค่าเครื่องดื่ม เหล้า/เบียร์' },
      { keywords: ['น้ำมัน', 'ทางด่วน', 'ค่ารถ', 'm-pass', 'easy pass', 'เดินทาง', 'grab', 'taxi', 'วิน', 'มอไซค์', 'แก๊ส', 'gas'], category: 'ค่าเดินทาง' },
      { keywords: ['คอม', 'คอมมิชชั่น', 'นายหน้า', 'หักเปอร์เซ็นต์'], category: 'ค่าคอมมิชชั่น' },
      { keywords: ['ช่าง', 'ค่าแรงช่าง', 'รายวันช่าง', 'จ้างทำ', 'ค่าแรง', 'แรงงาน'], category: 'ค่าจ้างช่างรายวัน' },
      { keywords: ['แม่บ้าน', 'ทำความสะอาด', 'ถูพื้น', 'กวาด', 'ทิ้งขยะ'], category: 'แม่บ้านรายวัน' },
      { keywords: ['แอดมิน', 'จ้างแอดมิน', 'คนตอบเพจ', 'ดูแลเพจ'], category: 'ค่าจ้างแอดมิน' },
      { keywords: ['อุปกรณ์', 'น็อต', 'สายไฟ', 'ท่อ', 'เบรกเกอร์', 'คีม', 'ไขควง', 'เทป', 'เคเบิล'], category: 'สั่งซื้ออุปกรณ์ประกอบชุด' },
    ];

    for (const rule of expenseRules) {
      if (rule.keywords.some(keyword => lowerDetail.includes(keyword))) {
        return rule.category;
      }
    }
  } else {
    const incomeRules: { keywords: string[]; category: string }[] = [
      { keywords: ['แบต', 'battery', 'ลิเธียม', 'แบตเตอรี่'], category: 'แบตเตอรี่' },
      { keywords: ['คอมบายเนอร์', 'อินเวอร์เตอร์', 'ตู้', 'inverter', 'combiner'], category: 'ตู้คอมบายเนอร์+อินเวอร์เตอร์' },
      { keywords: ['โซล่า', 'แผง', 'ติดตั้ง', 'เหมา', 'solar', 'sale order', 'ขายชุด'], category: 'รายรับจาก Sale order' },
    ];

    for (const rule of incomeRules) {
      if (rule.keywords.some(keyword => lowerDetail.includes(keyword))) {
        return rule.category;
      }
    }
  }

  return null;
};
