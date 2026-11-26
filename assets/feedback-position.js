// Coordinates are layout-viewport pixels, including the decorative tail footprint.
window.computeFeedbackPosition=function({viewport,button,safe={},mapRect=null,panelRect=null,dockRect=null,searchRect=null,panelAnchor=false,contentRects=[],contactRect=null}){
 const gap=12,w=button.width+4,h=button.height+14;
 const area={left:viewport.left+(safe.left||0)+gap,top:viewport.top+(safe.top||0)+gap,right:viewport.left+viewport.width-(safe.right||0)-gap,bottom:viewport.top+viewport.height-(safe.bottom||0)-gap};
 if(dockRect)area.bottom=Math.min(area.bottom,dockRect.top-gap);
 const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
 const at=(right,bottom)=>({x:clamp(right-w,area.left,area.right-w),y:clamp(bottom-h,area.top,area.bottom-h)});
 const candidates=[];
 if(panelAnchor&&panelRect){
  const bottom=Math.min(panelRect.bottom,area.bottom,mapRect?mapRect.bottom-36:area.bottom);
  candidates.push(at(panelRect.right+gap+w,bottom));
  candidates.push(at(panelRect.right+gap+w,panelRect.top+h));
  candidates.push(at(panelRect.right,bottom-(panelRect.height||panelRect.bottom-panelRect.top)-gap));
 }
 if(panelRect&&mapRect){candidates.push(at(Math.min(mapRect.right,area.right)-gap,Math.min(panelRect.bottom,area.bottom,mapRect.bottom-36)));candidates.push(at(Math.min(mapRect.right,area.right)-gap,mapRect.top+h+gap));}
 candidates.push(at(area.right,area.bottom),{x:area.left,y:Math.max(area.top,area.bottom-h)},{x:Math.max(area.left,area.right-w),y:area.top});
 const obstacles=[panelRect,...contentRects,dockRect,searchRect,...(mapRect?[{left:mapRect.left,right:mapRect.right,top:mapRect.bottom-32,bottom:mapRect.bottom}]:[])].filter(Boolean);
 const overlap=(p,r)=>Math.max(0,Math.min(p.x+w,r.right)-Math.max(p.x,r.left))*Math.max(0,Math.min(p.y+h,r.bottom)-Math.max(p.y,r.top));
 const winner=candidates.find(p=>obstacles.every(r=>overlap(p,r)===0))||candidates.reduce((best,p)=>obstacles.reduce((sum,r)=>sum+overlap(p,r),0)<obstacles.reduce((sum,r)=>sum+overlap(best,r),0)?p:best);
 return {left:winner.x+2,top:winner.y+2};
};
(()=>{
 const button=document.getElementById('floatingReport');if(!button)return;
 const panel=document.getElementById('stationPanel'),map=document.getElementById('mapViewport'),dock=document.querySelector('.dock'),search=document.getElementById('search-section');
 let frame=null;const titleMeasure=document.createElement('canvas').getContext('2d');
 const visible=element=>element&&!element.hidden&&element.getClientRects().length&&getComputedStyle(element).display!=='none';
 const rect=element=>visible(element)?element.getBoundingClientRect():null;
 function update(){
  frame=null;const v=window.visualViewport,root=getComputedStyle(document.documentElement);
  const inset=edge=>parseFloat(root.getPropertyValue('--feedback-safe-'+edge))||0;
  const mobile=window.matchMedia('(max-width:767px)').matches,fullscreen=document.body.classList.contains('map-fullscreen');
  const hero=document.querySelector('.hero');
  button.dataset.homeScrolled=String((hero?hero.getBoundingClientRect().bottom<=0:window.scrollY>80));
  const panelAnchor=!!rect(panel);button.classList.toggle('is-station-detail',panelAnchor);
  const title=panel?.querySelector('.compact-title h2');
  if(title){
   if(mobile&&panelAnchor&&titleMeasure){
    const style=getComputedStyle(title),parent=title.parentElement,parentStyle=getComputedStyle(parent);
    const available=parent.clientWidth-parseFloat(parentStyle.paddingLeft)-parseFloat(parentStyle.paddingRight);
    titleMeasure.font=style.fontWeight+' 16px '+style.fontFamily;
    const natural=titleMeasure.measureText(title.textContent).width;
    const size=Math.max(14,Math.min(16,16*Math.max(0,available)/Math.max(1,natural)));
    title.style.setProperty('--station-mobile-title-size',size.toFixed(2)+'px');
   }else title.style.removeProperty('--station-mobile-title-size');
  }
  if(mobile&&fullscreen&&panelAnchor){
   const p=rect(panel),m=rect(map),d=rect(dock),viewportLeft=v?.offsetLeft||0,viewportTop=v?.offsetTop||0;
   const right=viewportLeft+(v?.width||window.innerWidth)-inset('right')-10,left=p.right+6;
   const scale=Math.min(1,Math.max(0,right-left)/(button.offsetWidth+4));
   button.style.setProperty('--feedback-mobile-scale',String(scale));
   const height=(button.offsetHeight+14)*scale;
   const bottom=Math.min(p.bottom,viewportTop+(v?.height||window.innerHeight)-inset('bottom')-12,m?m.bottom-36:Infinity,d?d.top-12:Infinity);
   button.style.setProperty('--feedback-left',(left+2*scale)+'px');
   button.style.setProperty('--feedback-top',(Math.max(p.top,bottom-height)+2*scale)+'px');
   button.dataset.autoPositioned='true';button.dataset.positionedStation=panel.dataset?.stationId||'';
   return;
  }
  button.style.removeProperty('--feedback-mobile-scale');
  const contentRects=panelAnchor?[...panel.querySelectorAll('.station-identity-group,.station-tools')].map(rect).filter(Boolean):[];
  const position=window.computeFeedbackPosition({panelAnchor,contentRects,contactRect:panelAnchor?rect(panel.querySelector('.station-detail')):null,viewport:{left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||window.innerWidth,height:v?.height||window.innerHeight},button:button.getBoundingClientRect(),safe:{left:inset('left'),right:inset('right'),top:inset('top'),bottom:inset('bottom')},mapRect:rect(map),panelRect:rect(panel),dockRect:rect(dock),searchRect:rect(search)});
  button.style.setProperty('--feedback-left',position.left+'px');button.style.setProperty('--feedback-top',position.top+'px');button.dataset.autoPositioned='true';
  button.dataset.positionedStation=panel.dataset?.stationId||'';
 }
 function schedule(){if(frame===null)frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(update);});}
 if(window.ResizeObserver){const observer=new ResizeObserver(schedule);[panel,map,dock,search,button].filter(Boolean).forEach(element=>observer.observe(element));}
 if(window.MutationObserver)new MutationObserver(schedule).observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['hidden','class','open','data-station-id']});
 window.addEventListener('gasmap:station-rendered',schedule);window.addEventListener('gasmap:map-view-changed',schedule);
 document.fonts?.ready?.then(schedule);
 window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});
 window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 schedule();
})();
