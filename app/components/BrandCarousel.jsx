'use client';
import {useState} from 'react';
import {Pause,Play} from 'lucide-react';
const brands=[['Volkswagen','volkswagen'],['Chevrolet','chevrolet'],['Fiat','fiat'],['Hyundai','hyundai'],['Nissan','nissan'],['Renault','renault']];
export default function BrandCarousel({onBrand}){
 const [paused,setPaused]=useState(false);
 return <div className={`brand-section ${paused?'is-paused':''}`}><div className="brand-section-heading"><span>BOAS ESCOLHAS.<br/>GRANDES CAMINHOS.</span><button className="brand-pause" aria-label={paused?'Retomar carrossel de marcas':'Pausar carrossel de marcas'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button></div><div className="brand-marquee" role="region" aria-label="Marcas disponíveis no estoque"><div className="brand-marquee-track">{[false,true].map(duplicate=><div className="brand-marquee-group" key={String(duplicate)} aria-hidden={duplicate||undefined}>{brands.map(([name,slug])=><a key={slug} href="#estoque" className={`brand-logo brand-logo-${slug}`} aria-label={`Ver veículos ${name}`} tabIndex={duplicate?-1:0} onFocus={e=>{if(e.currentTarget.matches(':focus-visible'))e.currentTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}} onClick={()=>onBrand(name)}><img src={`/brands/${slug}.svg`} alt="" width="100" height="48" loading="lazy"/><span>{name}</span></a>)}</div>)}</div></div></div>;
}
