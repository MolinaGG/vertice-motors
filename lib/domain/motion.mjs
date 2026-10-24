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
 return {rotation:-.7+1.85*ease,x:1.05-2.1*ease,z:.3*Math.sin(progress*Math.PI),scale:1+.12*Math.sin(progress*Math.PI),cameraHeight:2.2-.5*Math.sin(progress*Math.PI),cameraDistance:7.8-.5*Math.sin(progress*Math.PI)};
}

export function calloutGeometry(point,label,side,width,height){
 if(![point.x,point.y,label.left,label.right,label.top,label.height,width,height].every(Number.isFinite)||width<=0||height<=0||point.x<0||point.x>width||point.y<0||point.y>height)return {visible:false,path:''};
 const endX=side==='left'?label.right+14:label.left-14,endY=label.top+label.height/2,elbow=endX+(side==='left'?32:-32);
 return {visible:true,path:`M${point.x},${point.y} L${elbow},${point.y} L${endX},${endY}`};
}

export function posterPoint(rect,naturalWidth,naturalHeight,point){
 const fit=Math.min(rect.width/naturalWidth,rect.height/naturalHeight),width=naturalWidth*fit,height=naturalHeight*fit;
 return {x:rect.left+(rect.width-width)/2+point.x*width,y:rect.top+(rect.height-height)/2+point.y*height};
}
