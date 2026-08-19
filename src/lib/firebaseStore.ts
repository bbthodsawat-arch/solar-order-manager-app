import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
type Row = Record<string, any>;
type Filter = { field: string; value: any };
class QueryBuilder {
  private readonly table: string; private filters: Filter[] = []; private limitCount?: number; private orderField?: string; private orderDirection: 'asc' | 'desc' = 'asc'; private selected?: string;
  constructor(table: string) { this.table = table; }
  select(columns?: string) { this.selected = columns; return this; }
  eq(field: string, value: any) { this.filters.push({ field, value }); return this; }
  limit(count: number) { this.limitCount = count; return this; }
  order(field: string, opts?: { ascending?: boolean }) { this.orderField = field; this.orderDirection = opts?.ascending === false ? 'desc' : 'asc'; return this; }
  async maybeSingle() { const result = await this.read(); return { data: result.data[0] ?? null, error: result.error }; }
  async single() { const result = await this.read(); return { data: result.data[0] ?? null, error: result.error }; }
  async then(resolve: any, reject?: any) { return this.read().then(resolve, reject); }
  async upsert(payload: Row | Row[], _options?: any) { try { const rows = Array.isArray(payload) ? payload : [payload]; for (const row of rows) { const id = String(row.id ?? crypto.randomUUID()); await setDoc(doc(db, this.table, id), row, { merge: true }); } return { data: payload, error: null }; } catch (error) { return { data: null, error }; } }
  async insert(payload: Row | Row[]) { return this.upsert(payload); }
  async update(payload: Row) { try { const id = this.filters.find(f => f.field === 'id')?.value; if (!id) throw new Error(`Firebase update requires id filter for ${this.table}`); await updateDoc(doc(db, this.table, String(id)), payload); return { data: payload, error: null }; } catch (error) { return { data: null, error }; } }
  async delete() { try { const result = await this.read(); for (const row of result.data) if (row.id) await deleteDoc(doc(db, this.table, String(row.id))); return { data: result.data, error: result.error }; } catch (error) { return { data: null, error }; } }
  private async read(): Promise<{ data: Row[]; error: any }> { try { const constraints: any[] = []; for (const filter of this.filters) constraints.push(where(filter.field, '==', filter.value)); if (this.orderField) constraints.push(orderBy(this.orderField, this.orderDirection)); if (this.limitCount) constraints.push(limit(this.limitCount)); const snapshot = await getDocs(query(collection(db, this.table), ...constraints)); const data = snapshot.docs.map(item => ({ id: item.id, ...item.data() })); return { data: this.selected ? data.map(row => { const result: Row = { id: row.id }; for (const key of this.selected!.split(',').map(k => k.trim())) if (key) result[key] = row[key]; return result; }) : data, error: null }; } catch (error) { return { data: [], error }; } }
}
export function getFirebaseStore() { return { from: (table: string) => new QueryBuilder(table) }; }
