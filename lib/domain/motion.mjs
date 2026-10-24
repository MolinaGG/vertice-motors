export function sceneState(scroll,range,reduced=false){
 if(reduced||!Number.isFinite(range)||range<=0)return {progress:0,chapter:0,scale:1,shift:0};
 const progress=Math.max(0,Math.min(1,Number.isFinite(scroll)?scroll/range:0));
 return {progress,chapter:progress<.34?0:progress<.7?1:2,scale:1.03+.13*Math.sin(progress*Math.PI),shift:-40*progress};
}
export function brandSequence(brands){return [false,true].flatMap(duplicate=>brands.map(name=>({name,duplicate})));}
