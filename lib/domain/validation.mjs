const text=(value,max=200)=>String(value??'').trim().slice(0,max);
const need=(condition,message)=>{if(!condition)throw new Error(message);};
export function validateLead(input,today=new Date().toISOString().slice(0,10)){
 const x=input||{},name=text(x.name,100),email=text(x.email,180).toLowerCase(),phone=text(x.phone,30).replace(/\D/g,''),kind=x.kind;
 need(!x.website,'Solicitação inválida.');need(name.length>=2,'Informe seu nome.');need(x.consent===true,'Autorize o contato para continuar.');
 need(['contact','test-drive'].includes(kind),'Tipo de solicitação inválido.');
 need(!email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Informe um e-mail válido.');
 need(!phone||phone.length>=10&&phone.length<=15,'Informe um telefone válido.');need(email||phone,'Informe e-mail ou telefone.');
 const vehicle_id=text(x.vehicle_id,80)||null;
 let date=null,period=null;
 if(kind==='test-drive'){
  date=text(x.date,10);period=text(x.period,20);
  need(vehicle_id&&/^[a-z0-9-]+$/.test(vehicle_id),'Selecione um veículo.');
  need(/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date&&date>=today&&date<=new Date(Date.parse(today)+180*86400000).toISOString().slice(0,10),'Escolha uma data válida nos próximos 180 dias.');
  need(['Manhã','Tarde'].includes(period),'Selecione o período.');
 }
 return {name,email,phone,kind,vehicle_id,date,period,message:text(x.message,2000),consent:true,status:'new'};
}
export function safePhoto(url){return typeof url==='string'&&(/^\/images\/[a-z0-9-]+\.(webp|avif|png|jpg)$/.test(url)||/^\/api\/media\/[a-z0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url));}
export function validateVehicle(input){
 const x=input||{},r={};
 for(const k of ['id','brand','model','version','category','transmission','fuel','color','engine','description'])r[k]=text(x[k],k==='description'?2000:100);
 need(/^[a-z0-9-]{3,80}$/.test(r.id),'Identificador deve conter letras minúsculas, números e hífens.');
 for(const k of ['brand','model','version','engine'])need(r[k].length>0,`Preencha ${k}.`);
 need(['Hatch','Sedã','SUV','Picape'].includes(r.category),'Categoria inválida.');need(['Manual','Automático'].includes(r.transmission),'Câmbio inválido.');need(['Flex','Gasolina','Diesel','Elétrico','Híbrido'].includes(r.fuel),'Combustível inválido.');
 for(const [k,min,max] of [['price',1,10000000],['km',0,2000000],['year',1980,new Date().getFullYear()+1],['manufacture_year',1980,new Date().getFullYear()+1],['doors',2,5],['seats',2,9]]){r[k]=Number(x[k]);need(Number.isFinite(r[k])&&r[k]>=min&&r[k]<=max&&(k==='price'||Number.isInteger(r[k])),`Valor inválido em ${k}.`);}
 need(r.manufacture_year<=r.year,'Ano de fabricação maior que ano-modelo.');
 r.status=x.status||'available';need(['available','reserved','sold'].includes(r.status),'Disponibilidade inválida.');r.featured=x.featured===true;r.archived=x.archived===true;
 r.equipment=Array.isArray(x.equipment)?x.equipment.slice(0,40).map(y=>text(y,100)).filter(Boolean):[];
 r.photos=Array.isArray(x.photos)?x.photos.slice(0,12):[];need(r.photos.every(safePhoto),'Imagem inválida ou fora do armazenamento da loja.');
 r.notes=text(x.notes,1000);return r;
}
export function validateSettings(input){
 const x=input||{},r={name:text(x.name,80),address:text(x.address,250),hours:text(x.hours,200),email:text(x.email,180),whatsapp:text(x.whatsapp,20).replace(/[\s()+-]/g,''),story:text(x.story,2000)};
 need(r.name.length>=2,'Informe o nome da loja.');need(!r.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email),'E-mail inválido.');need(!r.whatsapp||/^\d{12,15}$/.test(r.whatsapp),'WhatsApp deve conter código do país, DDD e número.');return r;
}
