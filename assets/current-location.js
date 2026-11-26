window.createCurrentLocation=function(bridge){
 const button=document.getElementById('currentLocationButton'),viewport=document.getElementById('mapViewport');
 let marker=null,busy=false,requestVersion=0,ready=false,toastTimer=null,lastMode=null;
 // 로컬 검토용 잠정 기준: 노출 주유소 외곽 사각형에서 사방 약 5km. 배포 전 운영자 확정 필요.
 const points=bridge.stations.filter(station=>station.visible!==false&&Number.isFinite(station.lat)&&Number.isFinite(station.lng));
 const paddingKm=5,midLatitude=(Math.min(...points.map(s=>s.lat))+Math.max(...points.map(s=>s.lat)))/2;
 const latitudePadding=paddingKm/111.32,longitudePadding=paddingKm/(111.32*Math.cos(midLatitude*Math.PI/180));
 const bounds={south:Math.min(...points.map(s=>s.lat))-latitudePadding,north:Math.max(...points.map(s=>s.lat))+latitudePadding,west:Math.min(...points.map(s=>s.lng))-longitudePadding,east:Math.max(...points.map(s=>s.lng))+longitudePadding};
 function inServiceArea(latitude,longitude){return points.length>0&&latitude>=bounds.south&&latitude<=bounds.north&&longitude>=bounds.west&&longitude<=bounds.east;}
 function toast(text){
  const element=document.getElementById('feedbackToast');clearTimeout(toastTimer);element.style.whiteSpace='pre-line';element.textContent=text;element.hidden=false;
  toastTimer=setTimeout(()=>{if(element.textContent===text)element.hidden=true;},6000);
 }
 function finish(ticket){if(ticket!==requestVersion)return false;++requestVersion;busy=false;button.disabled=false;button.removeAttribute('aria-busy');return true;}
 function failure(ticket,error){
  if(!finish(ticket))return;
  toast(error?.code===1?'위치 접근이 거부되었어요. 브라우저 또는 기기 설정에서 위치 권한을 허용한 뒤 다시 눌러 주세요.':error?.code===3?'위치 확인 시간이 초과됐어요. 잠시 후 현재 위치 버튼을 다시 눌러 주세요.':'현재 위치를 확인하지 못했어요. 기기의 위치 설정을 확인한 뒤 다시 눌러 주세요.');
 }
 function success(ticket,position){
  if(ticket!==requestVersion)return;
  const latitude=position?.coords?.latitude,longitude=position?.coords?.longitude;
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){failure(ticket,{code:2});return;}
  if(!inServiceArea(latitude,longitude)){if(finish(ticket))toast('현재 위치가 서비스 지역 밖에 있어요.\n대전 및 인근 지역의 주유소 정보를 제공하고 있어요.');return;}
  const map=bridge.getMap();if(!map){failure(ticket,{code:2});return;}
  try{
   const point=new naver.maps.LatLng(latitude,longitude);
   bridge.beforeLocate();
   if(marker)marker.setPosition(point);
   else marker=new naver.maps.Marker({map,position:point,clickable:false,zIndex:200,icon:{content:'<span class="gps-current-dot" role="img" aria-label="현재 위치"></span>',anchor:new naver.maps.Point(9,9)}});
   map.setZoom(14);map.setCenter(point);finish(ticket);
  }catch{failure(ticket,{code:2});}
 }
 button.addEventListener('click',()=>{
  stopEmphasis();
  if(document.visibilityState==='hidden')return;
  if(busy)return;
  if(!bridge.getMap()){toast('지도 연결을 확인한 뒤 다시 눌러 주세요.');return;}
  if(!window.isSecureContext||!navigator.geolocation||typeof navigator.geolocation.getCurrentPosition!=='function'){toast('이 브라우저에서는 현재 위치를 확인할 수 없어요. HTTPS 연결과 브라우저의 위치 기능 지원 여부를 확인해 주세요.');return;}
  const ticket=++requestVersion;busy=true;button.disabled=true;button.setAttribute('aria-busy','true');
  try{navigator.geolocation.getCurrentPosition(position=>success(ticket,position),error=>failure(ticket,error),{enableHighAccuracy:true,timeout:12000,maximumAge:0});}
  catch{failure(ticket,{code:2});}
 });
 function stopEmphasis(){button.classList.remove('gps-emphasis');}
 function syncMode(){
  if(!ready)return;
  const mode=document.body.classList.contains('map-fullscreen')?(document.body.classList.contains('feedback-lookup')?'lookup':'map'):null;
  if(mode===lastMode)return;lastMode=mode;stopEmphasis();
  if(mode&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){void button.offsetWidth;button.classList.add('gps-emphasis');}
 }
 button.addEventListener('animationend',event=>{if(event.animationName==='gps-control-pulse')stopEmphasis();});
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener?.('change',event=>{if(event.matches)stopEmphasis();});
 if(window.MutationObserver)new MutationObserver(syncMode).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&busy)finish(requestVersion);});
 window.addEventListener('pagehide',event=>{if(busy)finish(requestVersion);if(!event.persisted){++requestVersion;marker=null;}});
 return {ready(){ready=true;button.hidden=false;syncMode();}};
};
