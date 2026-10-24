export const defaultFilters={query:'',brand:'',category:'',maxPrice:'',minYear:'',maxKm:'',transmission:'',fuel:'',sort:'featured',favorites:false};
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function parseFilters(params){
 const f={...defaultFilters};
 for(const k of ['query','brand','category','transmission','fuel'])f[k]=(params.get(k)||'').slice(0,80);
 for(const k of ['maxPrice','minYear','maxKm']){const x=params.get(k);if(x&&Number.isFinite(Number(x))&&Number(x)>0)f[k]=x;}
 if(['featured','price-asc','price-desc','year-desc','km-asc'].includes(params.get('sort')))f.sort=params.get('sort');
 f.favorites=params.get('favorites')==='1';return f;
}
export function filterVehicles(vehicles,filters={},favorites=[]){
 const f={...defaultFilters,...filters},positive=x=>Number.isFinite(Number(x))&&Number(x)>0?Number(x):Infinity;
 const result=vehicles.filter(v=>v.status!=='sold'&&!v.archived&&(!f.query||normalize(`${v.brand} ${v.model} ${v.version}`).includes(normalize(f.query)))&&(!f.brand||v.brand===f.brand)&&(!f.category||v.category===f.category)&&(!f.transmission||v.transmission===f.transmission)&&(!f.fuel||v.fuel===f.fuel)&&v.price<=positive(f.maxPrice)&&v.km<=positive(f.maxKm)&&(!f.minYear||!Number.isFinite(Number(f.minYear))||v.year>=Number(f.minYear))&&(!f.favorites||favorites.includes(v.id)));
 const sorts={'price-asc':(a,b)=>a.price-b.price,'price-desc':(a,b)=>b.price-a.price,'year-desc':(a,b)=>b.year-a.year,'km-asc':(a,b)=>a.km-b.km,featured:(a,b)=>Number(b.featured)-Number(a.featured)};
 return result.sort((a,b)=>(sorts[f.sort]||sorts.featured)(a,b)||a.id.localeCompare(b.id));
}
export function toggleSelection(list,id,limit=Infinity){return list.includes(id)?list.filter(v=>v!==id):list.length>=limit?list:[...list,id];}
export function selectHighlights(vehicles){return vehicles.filter(vehicle=>vehicle.featured===true&&vehicle.status==='available'&&!vehicle.archived).slice(0,3);}
