import {
  assignProductBrand,
  matchesBrandFilter,
  resolveProductBrand,
  selectableBrands,
  type BrandRecord,
} from '../src/utils/brandProduct';

const brands: BrandRecord[] = [
  { id: 'brand-a', name: 'Alpha', isActive: true },
  { id: 'brand-b', name: 'Beta', isActive: false },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Brand workflow check failed: ${message}`);
}

const active = selectableBrands(brands);
assert(active.length === 1 && active[0].id === 'brand-a', 'inactive brands must not be selectable for new assignments');

const assigned = assignProductBrand({ id: 'p1', name: 'Panel' }, 'brand-a', brands);
assert(assigned.brandId === 'brand-a' && assigned.brandName === 'Alpha', 'new assignment must persist canonical id and display name');
assert(resolveProductBrand(assigned, brands)?.id === 'brand-a', 'canonical id must resolve');

const legacy = { id: 'p2', name: 'Legacy inverter', brandName: 'beta' };
assert(resolveProductBrand(legacy, brands)?.id === 'brand-b', 'legacy name must resolve even when inactive');
assert(matchesBrandFilter(legacy, 'brand-b', brands), 'legacy product must match resolved brand filter');

let rejectedInactive = false;
try {
  assignProductBrand({ id: 'p3', name: 'Battery' }, 'brand-b', brands);
} catch {
  rejectedInactive = true;
}
assert(rejectedInactive, 'new assignment to an inactive brand must be rejected');

console.log('Brand/product workflow checks passed');
