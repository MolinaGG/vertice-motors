'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowDown,Check} from 'lucide-react';
import {sceneState} from '@/lib/domain/motion.mjs';
import {money} from './ui';
import CarStage from './CarStage';
const chapters=[
 {lines:['O próximo carro.','As próximas','histórias.'],eyebrow:'SEMINOVOS. NOVAS POSSIBILIDADES.',copy:<>Seu caminho muda.<br/>Seu carro acompanha.</>},
 {lines:['Cada detalhe.','Uma escolha','sua.'],eyebrow:'APROXIME O OLHAR. AMPLIE AS POSSIBILIDADES.',copy:<>O que importa está nos detalhes.<br/>Escolha o que faz sentido para você.</>},
 {lines:['Novos caminhos.','A mesma','confiança.'],eyebrow:'O PRÓXIMO CAPÍTULO É SEU.',copy:<>Da primeira impressão ao próximo destino.<br/>Vamos encontrar o seu caminho.</>}
];
export default function HeroScene({featured,onDetail}){
 const track=useRef(null),controller=useRef(null),latest=useRef(0);const [chapter,setChapter]=useState(0),[staticMode,setStaticMode]=useState(false),[ready,setReady]=useState(false),[enabled,setEnabled]=useState(false),[failed,setFailed]=useState(false);
 const sceneReady=useCallback(()=>setReady(true),[]),sceneError=useCallback(()=>{setReady(false);setFailed(true);},[]);
 useEffect(()=>{
  const root=track.current,preference=matchMedia('(prefers-reduced-motion: reduce)');let frame=null;
  function update(){frame=null;const reduced=preference.matches||(innerWidth<560&&innerHeight<700),bounds=root.getBoundingClientRect(),state=sceneState(-bounds.top,root.offsetHeight-innerHeight,reduced);latest.current=state.progress;root.style.setProperty('--scene-progress',String(state.progress));root.style.setProperty('--scene-scale',String(state.scale));root.style.setProperty('--scene-shift',`${state.shift}px`);setChapter(current=>current===state.chapter?current:state.chapter);setStaticMode(reduced);const allow3d=!reduced&&!navigator.connection?.saveData;setEnabled(allow3d);if(!allow3d)setReady(false);controller.current?.update(state.progress);}
  function schedule(){if(frame===null)frame=requestAnimationFrame(update);}window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);preference.addEventListener('change',schedule);schedule();
  return()=>{if(frame!==null)cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);preference.removeEventListener('change',schedule);};
 },[]);
 const data=chapters[chapter];
 function jump(index){const root=track.current;if(!root)return;const distance=Math.max(0,root.offsetHeight-innerHeight),fraction=[0,.48,1][index];scrollTo({top:scrollY+root.getBoundingClientRect().top+distance*fraction,behavior:staticMode?'instant':'smooth'});}
 return <div className={`cinema-sequence ${staticMode?'is-static':''} ${enabled&&!failed&&ready?'has-3d':''}`} ref={track}><div className="hero cinema-hero"><img className="hero-image cinema-image" src="/images/hero.webp" alt="Onix vermelho em um showroom contemporâneo — imagem ilustrativa" fetchPriority="high" width="1536" height="1024"/>{enabled&&!failed&&<CarStage controller={controller} progress={latest} onReady={sceneReady} onError={sceneError}/>}<div className="hero-shade cinema-shade"/><div className="hero-content" key={chapter}><div className="eyebrow hero-eyebrow"><i/>{data.eyebrow}</div><h1>{data.lines[0]}<br/>{data.lines[1]}<br/><em>{data.lines[2]}</em></h1><p>{data.copy}</p><a href="#estoque" className="button button-red hero-cta">Encontre o seu próximo<ArrowUpRight size={21}/></a><div className="hero-assurance"><span><Check size={13}/>Informação clara</span><span><Check size={13}/>Escolha no seu tempo</span></div></div><div className="scene-navigation" aria-label="Cenas da apresentação"><span className="scene-progress"><i/></span>{chapters.map((_,index)=><button key={index} aria-label={`Ir para cena ${index+1}`} aria-current={chapter===index?'step':undefined} className={chapter===index?'active':''} onClick={()=>jump(index)}>0{index+1}</button>)}</div><div className="hero-bottom"><a href="#descubra" className="scroll-cue"><span>{chapter===2?'CONTINUE EXPLORANDO':'ROLE PARA DESCOBRIR'}</span><ArrowDown size={18}/></a>{featured&&<button className="hero-feature" onClick={()=>onDetail(featured)}><span><small>EM DESTAQUE</small><strong>{featured.brand} {featured.model}</strong><span>{featured.version} · {featured.year}</span></span><b>{money(featured.price)}</b><span className="feature-arrow"><ArrowUpRight size={22}/></span></button>}</div><span className="scene-caption">{String(chapter+1).padStart(2,'0')} / 03 <i/> {enabled&&!failed&&ready?'CENA 3D ILUSTRATIVA':'SUA PRÓXIMA HISTÓRIA'}</span></div></div>;
}
