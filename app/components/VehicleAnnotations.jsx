'use client';
import {useEffect,useRef} from 'react';
import {ShieldCheck,Sparkles} from 'lucide-react';
import {calloutGeometry,followCallouts} from '@/lib/domain/motion.mjs';

export default function VehicleAnnotations({bridge,ready,chapter}){
 const root=useRef(null),labels=useRef([]),paths=useRef([]),dots=useRef([]),last=useRef(null);
 useEffect(()=>{
  const node=root.current,hero=node.closest('.cinema-hero'),svg=node.querySelector('.vehicle-connectors');
  let layout=null;
  const limit=(value,max)=>Math.max(-max,Math.min(max,value));
  function draw(projection){
   last.current=projection;if(!layout)return;
   const {points,reference,carBounds,referenceCarBounds}=projection,{width,height,base,bounds,compact}=layout;
   const positions=followCallouts(points,reference,base,bounds,carBounds,referenceCarBounds);
   positions.forEach((position,index)=>{
    // The card and both connector ends use the same projected frame.
    labels.current[index].style.opacity=position.hidden?'0':'1';
    labels.current[index].style.transform=`translate3d(${position.left-base[index].left}px,${position.top-base[index].top}px,0)`;
    const target={...position,right:position.left+position.width},side=carBounds?(position.left>=carBounds.right?'right':position.left+position.width<=carBounds.left?'left':position.top+position.height<=carBounds.top?'above':'below'):(compact?(index===0?'above':'below'):(index===0?'left':'right'));
    const line=calloutGeometry(points[index],target,side,width,height),point=points[index];
    paths.current[index].setAttribute('d',line.path);dots.current[index].setAttribute('transform',`translate(${Number.isFinite(point?.x)?point.x:0} ${Number.isFinite(point?.y)?point.y:0})`);
    paths.current[index].style.opacity=line.visible&&!position.hidden?'1':'0';dots.current[index].style.opacity=line.visible&&!position.hidden?'1':'0';
   });
   const trails=hero.querySelector('.wheel-trails');let visibleTrail=false;
   projection.trails?.forEach((trail,index)=>{const valid=[trail.start.x,trail.start.y,trail.end.x,trail.end.y].every(Number.isFinite),length=Math.hypot(trail.end.x-trail.start.x,trail.end.y-trail.start.y);visibleTrail ||=valid&&length>1;const gradient=trails?.querySelector(`#wheel-red-gradient-${index}`);if(gradient&&valid){gradient.setAttribute('x1',String(trail.start.x));gradient.setAttribute('y1',String(trail.start.y));gradient.setAttribute('x2',String(trail.end.x));gradient.setAttribute('y2',String(trail.end.y));}trails?.querySelectorAll(`.wheel-trail:nth-of-type(${index+1}) path`).forEach(path=>path.setAttribute('d',valid?`M${trail.start.x},${trail.start.y} L${trail.end.x},${trail.end.y}`:''));});
   if(trails)trails.style.opacity=visibleTrail?'1':'0';
   const dx=points.reduce((sum,p,i)=>sum+p.x-reference[i].x,0)/points.length,dy=points.reduce((sum,p,i)=>sum+p.y-reference[i].y,0)/points.length;
   hero.style.setProperty('--copy-x',`${limit(dx*(compact?.1:.2),compact?8:48)}px`);
   hero.style.setProperty('--copy-y',`${limit(dy*.12,compact?5:14)}px`);
  }
  function measure(){
   const width=node.clientWidth,height=node.clientHeight,compact=width<=560,copy=hero.querySelector('.hero-content');
   const base=labels.current.map(label=>({left:label.offsetLeft,top:label.offsetTop,width:label.offsetWidth,height:label.offsetHeight}));
   let textBottom;
   if(compact){const panel=getComputedStyle(copy,'::before');textBottom=parseFloat(panel.top)+parseFloat(panel.height);}
   else textBottom=Math.max(...[...copy.children].map(panel=>panel.offsetTop+panel.offsetHeight));
   const caption=hero.querySelector('.scene-caption');
   layout={width,height,base,compact,bounds:{left:compact?16:24,right:width-(compact?16:24),top:textBottom+(compact?18:30),bottom:caption.offsetTop-20}};
   svg.setAttribute('viewBox',`0 0 ${width} ${height}`);hero.querySelector('.wheel-trails')?.setAttribute('viewBox',`0 0 ${width} ${height}`);if(last.current)draw(last.current);
  }
  const observer=new ResizeObserver(measure);observer.observe(node);labels.current.forEach(label=>observer.observe(label));
  hero.querySelectorAll('.hero-title,.hero-intro').forEach(panel=>observer.observe(panel));
  const controller={update:draw};bridge.current=controller;measure();
  return()=>{observer.disconnect();if(bridge.current===controller)bridge.current=null;};
 },[bridge,chapter]);
 return <div ref={root} className={`vehicle-annotations ${ready?'is-ready':''}`}><svg className="vehicle-connectors" aria-hidden="true" preserveAspectRatio="none">{[0,1].map(index=><g key={index}><path ref={node=>{paths.current[index]=node;}}/><g ref={node=>{dots.current[index]=node;}}><circle r="8" className="connector-halo"/><circle r="2.5"/></g></g>)}</svg><div ref={node=>{labels.current[0]=node;}} className="vehicle-callout callout-quality"><span className="callout-icon"><Sparkles size={17}/></span><div><small>01 / QUALIDADE</small><strong>Atenção em cada detalhe.</strong><p>Um novo olhar para sua próxima escolha.</p></div></div><div ref={node=>{labels.current[1]=node;}} className="vehicle-callout callout-safety"><span className="callout-icon"><ShieldCheck size={17}/></span><div><small>02 / SEGURANÇA</small><strong>Confiança para seguir.</strong><p>Informação clara para decidir com tranquilidade.</p></div></div></div>;
}
