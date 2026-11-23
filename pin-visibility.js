// Center the selected coordinate in the largest unobstructed map rectangle.
window.computePinAdjustment=function({mapRect,sheetRect,sheetHidden,pin,force=false}){
 const w=mapRect.width,h=mapRect.height;if(!(w>0&&h>0&&Number.isFinite(pin.x)&&Number.isFinite(pin.y)))return null;
 let free={left:0,top:0,right:w,bottom:h};
 if(!sheetHidden&&sheetRect){
  const l=Math.max(0,sheetRect.left-mapRect.left),r=Math.min(w,sheetRect.right-mapRect.left);
  const t=Math.max(0,sheetRect.top-mapRect.top),b=Math.min(h,sheetRect.bottom-mapRect.top);
  if(l<r&&t<b){
   const candidates=[{left:0,top:0,right:l,bottom:h},{left:r,top:0,right:w,bottom:h},{left:0,top:0,right:w,bottom:t},{left:0,top:b,right:w,bottom:h}];
   free=candidates.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top))[0];
  }
 }
 const fw=free.right-free.left,fh=free.bottom-free.top;if(fw<=0||fh<=0)return null;
 const inset=Math.min(24,fw/6,fh/6);
 if(!force&&pin.x>=free.left+inset&&pin.x<=free.right-inset&&pin.y>=free.top+inset&&pin.y<=free.bottom-inset)return null;
 return {x:pin.x-(free.left+free.right)/2,y:pin.y-(free.top+free.bottom)/2};
};
window.createPinVisibilityController=function({getMap,getCoordinate,mapElement,sheetElement,makePoint=(x,y)=>({x,y})}){
 // 지도 중심을 막 옮긴 직후에는 투영(좌표↔화면 변환)이 아직 이전 화면 기준일 수 있습니다. 그 상태로 보정값을 계산하면
 // 수 km 떨어진 곳으로 지도가 다시 이동하므로, 투영이 갱신된 것을 확인한 뒤에만 한 번 보정합니다.
 const MAX_WAIT_FRAMES=90,CENTER_TOLERANCE=8;
 let dragging=false,frame=null,forcePending=false,observer=null,generation=0;
 function cancel(){generation++;if(frame!==null)cancelAnimationFrame(frame);frame=null;forcePending=false;}
 function sameCoordinate(a,b){return !!a&&!!b&&Math.abs(a.lat()-b.lat())<1e-9&&Math.abs(a.lng()-b.lng())<1e-9;}
 function adjust(force,target,token,attempt){
  if(dragging||token!==generation)return;const map=getMap(),coord=getCoordinate();
  if(!map||!coord||!sameCoordinate(coord,target))return; // 그 사이 다른 주유소가 선택되면 이전 요청은 버립니다
  const projection=map.getProjection(),mapRect=mapElement.getBoundingClientRect();
  const center=projection.fromCoordToOffset(map.getCenter());
  if(Math.hypot(center.x-mapRect.width/2,center.y-mapRect.height/2)>CENTER_TOLERANCE){
   if(attempt<MAX_WAIT_FRAMES)frame=requestAnimationFrame(()=>{frame=null;adjust(force,target,token,attempt+1);});
   return;
  }
  const pin=projection.fromCoordToOffset(coord);
  if(!(Math.abs(pin.x-mapRect.width/2)<=mapRect.width&&Math.abs(pin.y-mapRect.height/2)<=mapRect.height)){if(force){map.setCenter(coord);request(true);}return;}
  const delta=window.computePinAdjustment({mapRect,sheetRect:sheetElement.getBoundingClientRect(),sheetHidden:sheetElement.hidden,pin,force});
  if(!delta||Math.hypot(delta.x,delta.y)<1||Math.hypot(delta.x,delta.y)>Math.hypot(mapRect.width,mapRect.height))return;
  map.setCenter(projection.fromOffsetToCoord(makePoint(center.x+delta.x,center.y+delta.y)));
 }
 function request(force=false){if(dragging)return;forcePending=forcePending||force;if(frame!==null)return;const token=generation,target=getCoordinate();frame=requestAnimationFrame(()=>{frame=null;const f=forcePending;forcePending=false;adjust(f,target,token,0);});}
 function interactionStart(){dragging=true;cancel();}function interactionEnd(){dragging=false;request(true);}
 function observe(){if(observer)return;if(window.ResizeObserver){observer=new ResizeObserver(()=>request(true));observer.observe(sheetElement);observer.observe(mapElement);}mapElement.addEventListener('pointerdown',interactionStart,{passive:true});window.addEventListener('pointerup',interactionEnd,{passive:true});window.addEventListener('pointercancel',interactionEnd,{passive:true});mapElement.addEventListener('touchstart',interactionStart,{passive:true});window.addEventListener('touchend',interactionEnd,{passive:true});window.addEventListener('touchcancel',interactionEnd,{passive:true});mapElement.addEventListener('wheel',cancel,{passive:true});}
 return {request,cancel,interactionStart,interactionEnd,observe};
};
