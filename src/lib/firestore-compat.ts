import { getSupabase } from './supabase';

type Ref = { kind:'doc'|'collection'; collection:string; id?:string; constraints?:any[] };
const ref = (collection:string,id?:string):Ref => ({kind:id?'doc':'collection',collection,id});
export const collection = (_db:any,name:string) => ref(name);
export const doc = (_db:any,name:string,id:string) => ref(name,id);
export const where = (field:string,op:any,value:any) => ({type:'where',field,op,value});
export const orderBy = (field:string,direction:'asc'|'desc'='asc') => ({type:'orderBy',field,direction});
export const limit = (value:number) => ({type:'limit',value});
export const query = (r:Ref,...constraints:any[]) => ({...r,constraints});
const tableMap:Record<string,string> = {users:'users',transactions:'transactions',customers:'customers',appointments:'appointments',warranties:'warranties',quick_notes:'quick_notes',audit_logs:'audit_logs',category_budgets:'category_budgets',recurring_transactions:'recurring_transactions'};
const table = (name:string) => tableMap[name] || 'legacy_documents';
const row = (collection:string,id:string,data:any) => table(collection)==='legacy_documents' ? {collection,document_id:id,data} : ({id,...data});
function normalizeRows(name:string,rows:any[]){ return table(name)==='legacy_documents' ? rows.map(r=>({id:r.document_id,...(r.data||{})})) : rows; }
export const getDocs = async (r:any) => {
  const client=getSupabase(); if(!client) throw new Error('Supabase is not configured');
  let q:any=client.from(table(r.collection)).select('*');
  for(const c of r.constraints||[]) if(c.type==='where') q=c.op==='=='?q.eq(c.field,c.value):c.op==='!='?q.neq(c.field,c.value):c.op==='>'?q.gt(c.field,c.value):c.op==='>='?q.gte(c.field,c.value):c.op==='<'?q.lt(c.field,c.value):c.op==='<='?q.lte(c.field,c.value):q;
  for(const c of r.constraints||[]) if(c.type==='orderBy') q=q.order(c.field,{ascending:c.direction==='asc'});
  for(const c of r.constraints||[]) if(c.type==='limit') q=q.limit(c.value);
  const {data,error}=await q; if(error) throw error; const rows=normalizeRows(r.collection,data||[]); return {empty:rows.length===0,size:rows.length,docs:rows.map((d:any)=>({id:d.id,data:()=>d,exists:()=>true,ref:ref(r.collection,d.id)}))};
};
export const getDoc = async (r:Ref) => { const s=await getDocs(r); return s.docs[0]||{id:r.id,data:()=>undefined,exists:()=>false,ref:r}; };
export const setDoc = async (r:Ref,data:any,options?:{merge?:boolean}) => {
  const client=getSupabase(); if(!client) throw new Error('Supabase is not configured');
  if(table(r.collection)==='legacy_documents') { const payload=row(r.collection,r.id!,options?.merge?data:data); const {error}=await client.from('legacy_documents').upsert(payload,{onConflict:'collection,document_id'}); if(error) throw error; return; }
  const payload={...data,id:r.id}; const {error}=await client.from(table(r.collection)).upsert(payload,{onConflict:'id'}); if(error) throw error;
};
export const addDoc = async (r:Ref,data:any) => { const id=crypto.randomUUID(); await setDoc(doc(null,r.collection,id),data); return doc(null,r.collection,id); };
export const updateDoc = async (r:Ref,data:any) => setDoc(r,data,{merge:true});
export const deleteDoc = async (r:Ref) => { const client=getSupabase(); if(!client) throw new Error('Supabase is not configured'); const {error}=await client.from(table(r.collection)).delete().eq(table(r.collection)==='legacy_documents'?'document_id':'id',r.id).eq(table(r.collection)==='legacy_documents'?'collection':'id',table(r.collection)==='legacy_documents'?r.collection:r.id); if(error) throw error; };
export const onSnapshot = (r:any,next:(s:any)=>void,error?:(e:any)=>void) => { let active=true; const run=async()=>{try{const s=await getDocs(r); if(active) next(r.kind==='doc'?s.docs[0]||{exists:()=>false,data:()=>undefined}:s);}catch(e){if(active) error?.(e);}}; void run(); const client=getSupabase(); const channel=client?.channel(`compat:${r.collection}:${r.id||'list'}`).on('postgres_changes',{event:'*',schema:'public',table:table(r.collection)},()=>void run()).subscribe(); return ()=>{active=false; if(channel) void client?.removeChannel(channel);}; };
export const serverTimestamp = () => new Date().toISOString();
export const Timestamp = { now: () => new Date() };
