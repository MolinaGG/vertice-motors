'use client';
import {useEffect,useRef} from 'react';
import {ShieldCheck,Sparkles} from 'lucide-react';
import {calloutGeometry} from '@/lib/domain/motion.mjs';
export default function VehicleAnnotations({bridge,ready}){
 const root=useRef(null),labels=useRef([]),paths=useRef([]),dots=useRef([]);
 useEffect(()=>{
  function update(points){
   const bounds=root.current?.getBoundingClientRect();if(!bounds)return;
   root.current.querySelector('svg').setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
   points.forEach((point,index)=>{const label=labels.current[index]?.getBoundingClientRect();if(!label)return;const line=calloutGeometry(point,{left:label.left-bounds.left,right:label.right-bounds.left,top:label.top-bounds.top,height:label.height},index===0?'left':'right',bounds.width,bounds.height);paths.current[index].setAttribute('d',line.path);dots.current[index].setAttribute('transform',`translate(${Number.isFinite(point.x)?point.x:0} ${Number.isFinite(point.y)?point.y:0})`);paths.current[index].style.opacity=line.visible?'1':'0';dots.current[index].style.opacity=line.visible?'1':'0';});
  }
  const controller={update};bridge.current=controller;return()=>{if(bridge.current===controller)bridge.current=null;};
 },[bridge]);
 return <div ref={root} className={`vehicle-annotations ${ready?'is-ready':''}`}><svg className="vehicle-connectors" aria-hidden="true" preserveAspectRatio="none">{[0,1].map(index=><g key={index}><path ref={node=>{paths.current[index]=node;}}/><g ref={node=>{dots.current[index]=node;}}><circle r="8" className="connector-halo"/><circle r="2.5"/></g></g>)}</svg><div ref={node=>{labels.current[0]=node;}} className="vehicle-callout callout-quality"><span className="callout-icon"><Sparkles size={17}/></span><div><small>01 / QUALIDADE</small><strong>Atenção em cada detalhe.</strong><p>Um novo olhar para sua próxima escolha.</p></div></div><div ref={node=>{labels.current[1]=node;}} className="vehicle-callout callout-safety"><span className="callout-icon"><ShieldCheck size={17}/></span><div><small>02 / SEGURANÇA</small><strong>Confiança para seguir.</strong><p>Informação clara para decidir com tranquilidade.</p></div></div></div>;
}
