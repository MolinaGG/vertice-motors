import Showroom from './components/Showroom';
import {gateway} from '@/lib/server';
import {seedVehicles,seedSettings} from '@/lib/seed.mjs';
export const dynamic='force-dynamic';
export default async function Home(){let vehicles=seedVehicles,settings=seedSettings,available=true;try{const data=await gateway('catalog');vehicles=data.vehicles;settings=data.settings||seedSettings;}catch{available=false;}return <Showroom initialVehicles={vehicles} initialSettings={settings} serviceAvailable={available}/>;}
