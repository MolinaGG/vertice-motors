export function isAdmin(user,admin){return !!user?.userId&&!!admin?.user_id&&user.userId===admin.user_id;}
export function canBootstrap(user,admin,privateSetup){return privateSetup===true&&!!user?.userId&&!admin;}
export async function digestToken(token){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifyToken(token,expected){if(typeof token!=='string'||token.length<48||typeof expected!=='string'||expected.length!==64)return false;const actual=await digestToken(token);let diff=0;for(let i=0;i<64;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
const publicActions=['catalog','createLead'];
const adminActions=['adminState','saveVehicle','archiveVehicle','updateLead','saveSettings','uploadPhoto','deletePhoto'];
export function authorizedAction(action,admin){return publicActions.includes(action)||admin===true&&adminActions.includes(action);}
export function validOrigin(origin,url){try{return !!origin&&new URL(origin).origin===new URL(url).origin;}catch{return false;}}
export function inspectImage(bytes,type){
 if(!bytes?.length||bytes.length>5*1024*1024)throw new Error('A imagem deve ter até 5 MB.');
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const webp=bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(type==='image/jpeg'&&jpg)return 'jpg';if(type==='image/png'&&png)return 'png';if(type==='image/webp'&&webp)return 'webp';throw new Error('Envie uma imagem JPG, PNG ou WebP válida.');
}
