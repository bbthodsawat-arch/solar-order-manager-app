import fs from 'node:fs';

const path = 'src/pages/AddTransaction.tsx';
let source = fs.readFileSync(path, 'utf8');

const before = "id?: string; name: string; address: string; district: string; province: string; zipcode: string; phone: string; customerTaxId?: string; customerBranch?: string; customerEmail?: string;";
const after = "id?: string; name: string; address: string; district: string; subdistrict: string; province: string; zipcode: string; phone: string; customerTaxId: string; customerBranch: string; customerEmail: string;";

if (source.includes(before)) source = source.replace(before, after);
source = source.replace(
  "district: '',\n      province: ThaiProvinces[0]",
  "district: '',\n      subdistrict: '',\n      province: ThaiProvinces[0]"
);

fs.writeFileSync(path, source);
console.log('POS type normalization patch applied');
