// Adjust the selected pin once per explicit selection/geometry change; never on map idle.
window.computePinAdjustment=function({mapRect,sheetRect,sheetHidden,pin,force=false}){
 const w=mapRect.width,h=mapRect.height;if(!(w>0&&h>0&&Number.isFinite(pin.x)&&Number.isFinite(pin.y)))return null;
 const overlaps=!sheetHidden&&sheetRect&&sheetRect.right>mapRect.left&&sheetRect.left<mapRect.right&&sheetRect.top<mapRect.bottom&&sheetRect.bottom>mapRect.top;
 const bottom=overlaps?Math.max(0,Math.min(h,sheetRect.top-mapRect.top)):h;
 const left=24,right=w-24,top=44,safeBottom=bottom-16;if(right<=left||safeBottom<=top)return null;
 if(!force&&pin.x>=left&&pin.x<=right&&pin.y>=top&&pin.y<=safeBottom)return null;
 return {x:pin.x-(left+right)/2,y:pin.y-(top+safeBottom)/2};
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
  if(!map||!coord||sheetElement.hidden||!sameCoordinate(coord,target))return; // 그 사이 다른 주유소가 선택되면 이전 요청은 버립니다
  const projection=map.getProjection(),mapRect=mapElement.getBoundingClientRect();
  const center=projection.fromCoordToOffset(map.getCenter());
  if(Math.hypot(center.x-mapRect.width/2,center.y-mapRect.height/2)>CENTER_TOLERANCE){
   if(attempt<MAX_WAIT_FRAMES)frame=requestAnimationFrame(()=>{frame=null;adjust(force,target,token,attempt+1);});
   return;
  }
  const pin=projection.fromCoordToOffset(coord);
  if(!(Math.abs(pin.x-mapRect.width/2)<=mapRect.width&&Math.abs(pin.y-mapRect.height/2)<=mapRect.height))return;
  const delta=window.computePinAdjustment({mapRect,sheetRect:sheetElement.getBoundingClientRect(),sheetHidden:sheetElement.hidden,pin,force});
  if(!delta||Math.hypot(delta.x,delta.y)<1||Math.hypot(delta.x,delta.y)>Math.hypot(mapRect.width,mapRect.height))return;
  map.setCenter(projection.fromOffsetToCoord(makePoint(center.x+delta.x,center.y+delta.y)));
 }
 function request(force=false){if(dragging)return;forcePending=forcePending||force;if(frame!==null)return;const token=generation,target=getCoordinate();frame=requestAnimationFrame(()=>{frame=null;const f=forcePending;forcePending=false;adjust(f,target,token,0);});}
 function interactionStart(){dragging=true;cancel();}function interactionEnd(){dragging=false;}
 function observe(){if(observer)return;if(window.ResizeObserver){observer=new ResizeObserver(()=>request(false));observer.observe(sheetElement);}mapElement.addEventListener('pointerdown',interactionStart,{passive:true});window.addEventListener('pointerup',interactionEnd,{passive:true});window.addEventListener('pointercancel',interactionEnd,{passive:true});mapElement.addEventListener('touchstart',interactionStart,{passive:true});window.addEventListener('touchend',interactionEnd,{passive:true});window.addEventListener('touchcancel',interactionEnd,{passive:true});mapElement.addEventListener('wheel',cancel,{passive:true});}
 return {request,cancel,interactionStart,interactionEnd,observe};
};
