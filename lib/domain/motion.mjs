export function sceneState(scroll,range,reduced=false){
 if(reduced||!Number.isFinite(range)||range<=0)return {progress:0,chapter:0,scale:1,shift:0};
 const progress=Math.max(0,Math.min(1,Number.isFinite(scroll)?scroll/range:0));
 return {progress,chapter:progress<.34?0:progress<.7?1:2,scale:1.03+.13*Math.sin(progress*Math.PI),shift:-40*progress};
}
export function brandSequence(brands){return [false,true].flatMap(duplicate=>brands.map(name=>({name,duplicate})));}
export function carPose(value){
 const progress=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
 // A single continuous path makes reverse scrolling retrace the same shot.
 const ease=progress*progress*(3-2*progress);
 return {rotation:-.7+2.65*ease,scale:1+.12*Math.sin(progress*Math.PI),cameraHeight:2.2-.5*Math.sin(progress*Math.PI),cameraDistance:7.8-.5*Math.sin(progress*Math.PI)};
}
