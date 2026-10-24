'use client';
import {useEffect,useRef} from 'react';
export default function CarStage({controller,progress,onReady,onError}){
 const host=useRef(null);
 useEffect(()=>{
  let cancelled=false,scene=null,observer=null;
  import('@/lib/hero/car-scene.js').then(({mountCarScene})=>{
   if(cancelled)return;
   scene=mountCarScene(host.current,{onReady:()=>{if(!cancelled)onReady();},onError:()=>{if(!cancelled)onError();}});
   controller.current=scene;scene.update(progress.current);
   observer=new IntersectionObserver(([entry])=>scene?.setActive(entry.isIntersecting),{rootMargin:'100px'});observer.observe(host.current);
  }).catch(()=>{if(!cancelled)onError();});
  return()=>{cancelled=true;observer?.disconnect();if(controller.current===scene)controller.current=null;scene?.dispose();};
 },[controller,progress,onReady,onError]);
 return <div ref={host} className="car-stage" aria-hidden="true"/>;
}
