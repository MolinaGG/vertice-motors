import {inspectImage} from './access.mjs';
/** Uploads use content-addressed keys; an uncertain network retry cannot duplicate objects. */
export async function uploadAndAttachPhoto({vehicleId,bytes,type},storage){
 if(!/^[a-z0-9-]{3,80}$/.test(vehicleId))throw new Error('Veículo inválido.');
 const ext=inspectImage(bytes,type),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const path=`${vehicleId}/${digest}.${ext}`,url=`/api/media/${path}`;
 const persisted=await storage.getVehicle(vehicleId);if(!persisted)throw new Error('Salve o veículo antes de enviar fotos.');
 const photos=persisted.photos||[];if(photos.length>=12&&!photos.includes(url))throw new Error('O veículo já tem 12 imagens. Remova uma antes de continuar.');
 await storage.put(path,bytes,type);
 const vehicle=await storage.attach(vehicleId,url);
 return {url,photos:vehicle.photos,vehicle};
}
