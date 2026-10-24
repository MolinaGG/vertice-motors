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
 return {rotation:-.7,x:1.05-2.6*ease,z:0,scale:1,cameraHeight:2.2,cameraDistance:7.8};
}

export function calloutGeometry(point,label,side,width,height){
 if(![point.x,point.y,label.left,label.right,label.top,label.height,width,height].every(Number.isFinite)||width<=0||height<=0||point.x<0||point.x>width||point.y<0||point.y>height)return {visible:false,path:''};
 if(side==='above'||side==='below'){const endX=(label.left+label.right)/2,endY=side==='above'?label.top+label.height+14:label.top-14,elbow=endY+(side==='above'?24:-24);return {visible:true,path:`M${point.x},${point.y} L${point.x},${elbow} L${endX},${endY}`};}
 const endX=side==='left'?label.right+14:label.left-14,endY=label.top+label.height/2,elbow=endX+(side==='left'?32:-32);
 return {visible:true,path:`M${point.x},${point.y} L${elbow},${point.y} L${endX},${endY}`};
}

export function posterPoint(rect,naturalWidth,naturalHeight,point){
 const fit=Math.min(rect.width/naturalWidth,rect.height/naturalHeight),width=naturalWidth*fit,height=naturalHeight*fit;
 return {x:rect.left+(rect.width-width)/2+point.x*width,y:rect.top+(rect.height-height)/2+point.y*height};
}

export function followCallouts(points,reference,labels,bounds,car=null,referenceCar=car){
 const clamp=(value,min,max)=>Math.max(min,Math.min(Math.max(min,max),value));
 let placed=labels.map((label,index)=>{
  const point=points[index],origin=reference[index],dx=Number.isFinite(point?.x)&&Number.isFinite(origin?.x)?point.x-origin.x:0,dy=Number.isFinite(point?.y)&&Number.isFinite(origin?.y)?point.y-origin.y:0;
  return {...label,left:clamp(label.left+dx,bounds.left,bounds.right-label.width),top:clamp(label.top+dy,bounds.top,bounds.bottom-label.height)};
 });
 if(car&&referenceCar){
  const gap=12,maxWidth=Math.max(...labels.map(label=>label.width));
  const inside=box=>box.left>=bounds.left&&box.left+box.width<=bounds.right&&box.top>=bounds.top&&box.top+box.height<=bounds.bottom;
  const overlaps=(a,b)=>a.left<b.right+gap&&a.left+a.width+gap>b.left&&a.top<b.bottom+gap&&a.top+a.height+gap>b.top;
  const safe=box=>inside(box)&&!overlaps(box,car);
  const rightMode=referenceCar.right+gap+maxWidth<=bounds.right;
  const splitMode=referenceCar.top-bounds.top>=labels[0].height+gap&&bounds.bottom-referenceCar.bottom>=labels[1].height+gap;
  if(rightMode){placed=placed.map(box=>({...box,left:car.right+gap}));}
  else if(splitMode){placed=placed.map((box,index)=>({...box,top:index===0?car.top-gap-box.height:car.bottom+gap}));}
  else {const rowWidth=labels.reduce((sum,label)=>sum+label.width,0)+gap,center=clamp((car.left+car.right)/2,bounds.left+rowWidth/2,bounds.right-rowWidth/2);let left=center-rowWidth/2;placed=placed.map(box=>{const result={...box,left,top:car.bottom+gap};left+=box.width+gap;return result;});}
  const resolved=[];
  for(let index=0;index<placed.length;index++){
   const box=placed[index],overlapsLabel=candidate=>resolved.some(other=>!other.hidden&&overlaps(candidate,{left:other.left,right:other.left+other.width,top:other.top,bottom:other.top+other.height}));
   const candidates=[box,{...box,left:car.right+gap},{...box,left:car.left-box.width-gap},{...box,top:car.top-box.height-gap},{...box,top:car.bottom+gap},...resolved.flatMap(other=>[{...box,top:other.top+other.height+gap},{...box,top:other.top-box.height-gap}])];
   const fit=candidates.find(candidate=>safe(candidate)&&!overlapsLabel(candidate));
   resolved.push(fit||{...box,hidden:true});
  }
  return resolved;
 }
 if(placed.length===2){const [a,b]=placed,gap=12;
  if(a.left<b.left+b.width+gap&&a.left+a.width+gap>b.left&&a.top<b.top+b.height+gap&&a.top+a.height+gap>b.top){
   b.top=clamp(a.top+a.height+gap,bounds.top,bounds.bottom-b.height);
   if(b.top<a.top+a.height+gap)a.top=clamp(b.top-a.height-gap,bounds.top,bounds.bottom-a.height);
  }
 }
 return placed;
}

export function wheelTrailLength(progress){return Math.min(3.4,Math.max(0,carPose(0).x-carPose(progress).x)*1.35);}
