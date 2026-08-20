import fs from 'node:fs';

const path = 'src/pages/AddTransaction.tsx';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes("from 'thai-address-select'")) {
  source = source.replace(
    "import { suggestCategory } from '../utils/categorySuggestions';",
    "import { suggestCategory } from '../utils/categorySuggestions';\nimport { loadData, getProvinces, getDistricts, getSubDistricts, getzip_code } from 'thai-address-select';"
  );
}

source = source.replace("province: ThaiProvinces[0],\n      zipcode: '',", "province: '',\n      subdistrict: '',\n      zipcode: '',");

if (!source.includes('const [thaiAddressReady')) {
  source = source.replace(
    '  // Delivery / Shipping\n',
    "  const [thaiAddressReady, setThaiAddressReady] = useState(false);\n\n  useEffect(() => {\n    let active = true;\n    loadData().then(() => { if (active) setThaiAddressReady(true); }).catch((error) => {\n      console.error('Thai address data failed to load:', error);\n      notifyReaction('error', 'ไม่สามารถโหลดฐานข้อมูลที่อยู่ไทยได้');\n    });\n    return () => { active = false; };\n  }, []);\n\n  // Delivery / Shipping\n",
    1
  );
}

source = source.replace(
  "  const handleCheckoutSale = async (e: FormEvent) => {\n    e.preventDefault();\n    if (cart.length === 0) return notifyReaction('warning', 'กรุณาเลือกสินค้าลงตะกร้าอย่างน้อย 1 รายการ');\n    if (!customer.name.trim()) return notifyReaction('warning', 'กรุณากรอกชื่อลูกค้า');",
  "  const handleCheckoutSale = async () => {\n    if (cart.length === 0) return notifyReaction('warning', 'กรุณาเลือกสินค้าลงตะกร้าอย่างน้อย 1 รายการ');\n    const customerDisplayName = customer.name.trim() || 'ลูกค้าทั่วไป';"
);

const checkoutRegex = /      \/\/ Automatically link or save customer in CRM[\s\S]*?      const detailString = cart\.length > 1[\s\S]*?: `\$\{customer\.name\} - \$\{mainSubcategory\}`;/;
const checkoutReplacement = `      // Create/link a CRM customer only when a real customer name was provided.
      let customerId = customer.id;
      if (customer.name.trim()) {
        try {
          customerId = await findOrCreateCustomer({
            name: customer.name.trim(),
            phoneNumber: customer.phone.trim(),
            customerAddress: customer.address.trim(),
            district: customer.district.trim(),
            province: customer.province,
            zipcode: customer.zipcode.trim(),
            customerTaxId: customer.customerTaxId.trim(),
            customerBranch: customer.customerBranch.trim(),
            email: customer.customerEmail.trim(),
          });
        } catch (crmErr) {
          console.error('CRM customer creation notice:', crmErr);
        }
      }

      const mainSubcategory = cart[0].name;
      const detailString = cart.length > 1
        ? customerDisplayName + ' - ' + mainSubcategory + ' และอื่นๆ (' + cart.length + ' รายการ)'
        : customerDisplayName + ' - ' + mainSubcategory;`;
source = source.replace(checkoutRegex, checkoutReplacement);

source = source.replace(
  "        customerName: customer.name,\n        customerAddress: customer.address,\n        district: customer.district,",
  "        customerName: customerDisplayName,\n        customerAddress: customer.address,\n        district: customer.district,\n        subdistrict: customer.subdistrict,"
);

source = source.replace(
  "setCustomer({ name: '', address: '', district: '', province: ThaiProvinces[0], zipcode: '', phone: '',",
  "setCustomer({ name: '', address: '', district: '', subdistrict: '', province: '', zipcode: '', phone: '',"
);

source = source.replace('placeholder="ชื่อลูกค้า *"', 'placeholder="ชื่อลูกค้า (ไม่กรอกได้ — ลูกค้าทั่วไป)"');

const oldAddress = `                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={customer.province}
                      onChange={e => setCustomer({...customer, province: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      {ThaiProvinces.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>

                    <input 
                      type="text" 
                      placeholder="รหัสไปรษณีย์" 
                      value={customer.zipcode}
                      onChange={e => setCustomer({...customer, zipcode: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>`;
const newAddress = `                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select value={customer.province} onChange={e => setCustomer({...customer, province: e.target.value, district: '', subdistrict: '', zipcode: ''})} className="w-full min-h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white">
                        <option value="">เลือกจังหวัด</option>
                        {(thaiAddressReady ? getProvinces() : ThaiProvinces).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={customer.district} disabled={!customer.province || !thaiAddressReady} onChange={e => setCustomer({...customer, district: e.target.value, subdistrict: '', zipcode: ''})} className="w-full min-h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50">
                        <option value="">เลือกอำเภอ/เขต</option>
                        {customer.province && thaiAddressReady && getDistricts(customer.province).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={customer.subdistrict} disabled={!customer.district || !thaiAddressReady} onChange={e => { const subdistrict = e.target.value; setCustomer({...customer, subdistrict, zipcode: customer.province && customer.district && subdistrict ? getzip_code(customer.province, customer.district, subdistrict) : ''}); }} className="w-full min-h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50">
                        <option value="">เลือกตำบล/แขวง</option>
                        {customer.province && customer.district && thaiAddressReady && getSubDistricts(customer.province, customer.district).map(sd => <option key={sd} value={sd}>{sd}</option>)}
                      </select>
                    </div>
                    <input type="text" placeholder="รหัสไปรษณีย์ (อัตโนมัติ)" value={customer.zipcode} readOnly className="w-full min-h-11 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-800 dark:text-white" />
                  </div>`;
if (source.includes(oldAddress)) source = source.replace(oldAddress, newAddress);

source = source.replace(
  '<span>บันทึกการขาย (฿{formatNumber(netTotalAmount)})</span>',
  '<span>{customer.name.trim() ? `บันทึกการขาย (฿${formatNumber(netTotalAmount)})` : `บันทึกขายทั่วไป (฿${formatNumber(netTotalAmount)})`}</span>'
);

fs.writeFileSync(path, source);
console.log('POS build patch applied');
