'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowDown,Check} from 'lucide-react';
import {sceneState,carPose,posterPoint,wheelTrailLength} from '@/lib/domain/motion.mjs';
import {posterAnchors,posterWheels,posterBounds} from '@/lib/domain/poster.mjs';
import CarStage from './CarStage';
import VehicleAnnotations from './VehicleAnnotations';
const chapters=[
 {lines:['Escolha bem.','Vá além.'],eyebrow:'SEMINOVOS. NOVAS POSSIBILIDADES.',copy:<>Seu caminho muda.<br/>Seu carro acompanha.</>},
 {lines:['Qualidade em','cada detalhe.'],eyebrow:'APROXIME O OLHAR. AMPLIE AS POSSIBILIDADES.',copy:<>O que importa está nos detalhes.<br/>Escolha o que faz sentido para você.</>},
 {lines:['Seu próximo','capítulo.'],eyebrow:'O PRÓXIMO CAPÍTULO É SEU.',copy:<>Da primeira impressão ao próximo destino.<br/>Vamos encontrar o seu caminho.</>}
];
export default function HeroScene({discoveryHref='#estoque'}){
 const track=useRef(null),poster=useRef(null),refreshPoster=useRef(null),is3D=useRef(false),controller=useRef(null),annotations=useRef(null),latest=useRef(0);const [chapter,setChapter]=useState(0),[staticMode,setStaticMode]=useState(false),[ready,setReady]=useState(false),[enabled,setEnabled]=useState(false),[failed,setFailed]=useState(false),[posterReady,setPosterReady]=useState(false);
 const sceneReady=useCallback(()=>{is3D.current=true;setReady(true);},[]),sceneError=useCallback(()=>{is3D.current=false;setReady(false);setFailed(true);refreshPoster.current?.();},[]);
 useEffect(()=>{
  const root=track.current,preference=matchMedia('(prefers-reduced-motion: reduce)');let frame=null,visualProgress=0,lastTime=0;
  function update(time){frame=null;const reduced=preference.matches||(innerWidth<560&&innerHeight<700),bounds=root.getBoundingClientRect(),state=sceneState(-bounds.top,root.offsetHeight-innerHeight,reduced);latest.current=state.progress;const delta=Math.min(64,lastTime?time-lastTime:16);lastTime=time;visualProgress=reduced?0:visualProgress+(state.progress-visualProgress)*(1-Math.exp(-delta/120));if(Math.abs(state.progress-visualProgress)<.0001)visualProgress=state.progress;root.style.setProperty('--scene-progress',String(state.progress));root.style.setProperty('--scene-scale',String(state.scale));root.style.setProperty('--scene-shift',`${state.shift}px`);const pose=carPose(visualProgress);root.style.setProperty('--poster-travel',`${(pose.x-1.05)*root.clientWidth*(innerWidth<560?.085:.12)}px`);root.style.setProperty('--poster-scale',String(pose.scale));setChapter(current=>current===state.chapter?current:state.chapter);setStaticMode(reduced);const allow3d=!reduced&&!navigator.connection?.saveData;setEnabled(allow3d);if(!allow3d){is3D.current=false;setReady(false);}controller.current?.update(state.progress);projectPoster();if(visualProgress!==state.progress)schedule();}
  function projectPoster(){if(is3D.current||!poster.current?.naturalWidth)return;setPosterReady(true);const img=poster.current,hero=root.querySelector('.cinema-hero').getBoundingClientRect(),rect=img.getBoundingClientRect(),kind=img.currentSrc.includes('-mobile')?'mobile':'desktop',points=posterAnchors[kind];const picture=img.parentElement,base={left:hero.left+picture.offsetLeft,top:hero.top+picture.offsetTop,width:picture.clientWidth,height:picture.clientHeight},mapPoint=(point,area)=>{const p=posterPoint(area,img.naturalWidth,img.naturalHeight,point);return {x:p.x-hero.left,y:p.y-hero.top};};const boxFor=area=>{const box=posterBounds[kind],a=mapPoint({x:box.left,y:box.top},area),b=mapPoint({x:box.right,y:box.bottom},area);return {left:a.x,top:a.y,right:b.x,bottom:b.y};},length=wheelTrailLength(visualProgress);annotations.current?.update({points:points.map(point=>mapPoint(point,rect)),reference:points.map(point=>mapPoint(point,base)),carBounds:boxFor(rect),referenceCarBounds:boxFor(base),trails:posterWheels[kind].map(wheel=>({start:mapPoint(wheel.start,rect),end:mapPoint({x:wheel.start.x+(wheel.unit.x-wheel.start.x)*length,y:wheel.start.y+(wheel.unit.y-wheel.start.y)*length},rect)}))});}
  refreshPoster.current=projectPoster;
  function schedule(){if(frame===null)frame=requestAnimationFrame(update);}window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);preference.addEventListener('change',schedule);schedule();
  return()=>{refreshPoster.current=null;if(frame!==null)cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);preference.removeEventListener('change',schedule);};
 },[]);
 const data=chapters[chapter];
 function jump(index){const root=track.current;if(!root)return;const distance=Math.max(0,root.offsetHeight-innerHeight),fraction=[0,.48,1][index];scrollTo({top:scrollY+root.getBoundingClientRect().top+distance*fraction,behavior:staticMode?'instant':'smooth'});}
 return <div className={`cinema-sequence ${staticMode?'is-static':''} ${enabled&&!failed&&ready?'has-3d':''}`} ref={track}>
  <div className="hero cinema-hero dynamic-hero">
   <img className="hero-city" src="/images/city.webp" alt="" aria-hidden="true" fetchPriority="high" width="1920" height="1080"/>
   <svg className="wheel-trails" aria-hidden="true" preserveAspectRatio="none"><defs>{[0,1].map(index=><linearGradient key={index} id={`wheel-red-gradient-${index}`} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#ff253c"/><stop offset="1" stopColor="#ff253c" stopOpacity="0"/></linearGradient>)}</defs>{[0,1].map(index=><g className="wheel-trail" key={index}><path className="trail-glow"/><path className="trail-red"/><path className="trail-core"/></g>)}</svg>
   <picture className="car-poster"><source media="(max-width: 560px)" srcSet="/images/car-poster-mobile.webp"/><img ref={poster} src="/images/car-poster-desktop.webp" alt="Carro vermelho ilustrativo da apresentação" width="1348" height="685" onLoad={()=>{setPosterReady(true);refreshPoster.current?.();}}/></picture>
   {enabled&&!failed&&<CarStage controller={controller} progress={latest} annotations={annotations} onReady={sceneReady} onError={sceneError}/>}
   <div className="hero-shade cinema-shade"/>
   <div className="hero-content" key={chapter}>
    <div className="hero-title"><div className="eyebrow hero-eyebrow"><i/>{data.eyebrow}</div><h1><span className="hero-headline-line">{data.lines[0]}</span>{' '}<em className="hero-headline-line">{data.lines[1]}</em></h1></div>
    <div className="hero-intro"><p>{data.copy}</p><a href={discoveryHref} className="button button-red hero-cta">Explore os carros<ArrowUpRight size={21}/></a><div className="hero-assurance"><span><Check size={13}/>Informação clara</span><span><Check size={13}/>Escolha no seu tempo</span></div></div>
   </div>
   <VehicleAnnotations chapter={chapter} bridge={annotations} ready={(enabled&&!failed&&ready)||posterReady}/>
   <div className="scene-navigation" aria-label="Cenas da apresentação"><span className="scene-progress"><i/></span>{chapters.map((_,index)=><button key={index} aria-label={`Ir para cena ${index+1}`} aria-current={chapter===index?'step':undefined} className={chapter===index?'active':''} onClick={()=>jump(index)}>0{index+1}</button>)}</div>
   <div className="hero-bottom"><a href={discoveryHref} className="scroll-cue"><span>{chapter===2?'CONTINUE EXPLORANDO':'ROLE PARA DESCOBRIR'}</span><ArrowDown size={18}/></a></div>
   <span className="scene-caption">{String(chapter+1).padStart(2,'0')} / 03 <i/> CENA ILUSTRATIVA · VÉRTICE</span>
  </div>
 </div>;
}
