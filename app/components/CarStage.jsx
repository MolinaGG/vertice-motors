'use client';
import {useEffect,useRef} from 'react';
export default function CarStage({controller,progress,annotations,onReady,onError}){
 const host=useRef(null);
 useEffect(()=>{
  let cancelled=false,scene=null,observer=null;
  import('@/lib/hero/car-scene.js').then(({mountCarScene})=>{
   if(cancelled)return;
   scene=mountCarScene(host.current,{onReady:()=>{if(!cancelled)onReady();},onError:()=>{if(!cancelled)onError();},onProject:projection=>{if(cancelled)return;const canvasBounds=host.current?.getBoundingClientRect(),heroBounds=host.current?.closest('.cinema-hero')?.getBoundingClientRect();if(!canvasBounds||!heroBounds)return;const mapPoint=point=>({x:canvasBounds.left-heroBounds.left+point.x*canvasBounds.width,y:canvasBounds.top-heroBounds.top+point.y*canvasBounds.height});annotations.current?.update({points:projection.points.map(mapPoint),reference:projection.reference.map(mapPoint)});}});
   controller.current=scene;scene.update(progress.current);
   observer=new IntersectionObserver(([entry])=>scene?.setActive(entry.isIntersecting),{rootMargin:'100px'});observer.observe(host.current);
  }).catch(()=>{if(!cancelled)onError();});
  return()=>{cancelled=true;observer?.disconnect();if(controller.current===scene)controller.current=null;scene?.dispose();};
 },[controller,progress,annotations,onReady,onError]);
 return <div ref={host} className="car-stage" aria-hidden="true"/>;
}
