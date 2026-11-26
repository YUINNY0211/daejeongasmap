window.createFeedbackLookup=function(bridge){
 const $=id=>document.getElementById(id),DAY=86400000,pending=new Map();
 let active=false,selected=null,expanded=false,rows=[],state='idle',version=0,placementFrame=null;
 const time=raw=>Date.parse(raw);
 function publicRows(items,id,now=Date.now()){
  if(!Array.isArray(items))throw Error('invalid_response');
  const seen=new Set();
  return items.filter(item=>{
   const created=Number.isFinite(item.publicExpiresAt)?item.publicExpiresAt-90*DAY:time(item.reportedAt);
   if(item.stationId!==id||!['received','not_received'].includes(item.status)||item.hidden||item.withdrawn||!Number.isSafeInteger(item.id)||seen.has(item.id)||!Number.isFinite(created)||created<=now-30*DAY||created>now||!Number.isFinite(time(item.reportedAt))||item.publicExpiresAt<=now)return false;
   seen.add(item.id);return true;
  }).sort((a,b)=>time(b.reportedAt)-time(a.reportedAt)||b.id-a.id).slice(0,5).map(item=>({status:item.status,reportedAt:item.reportedAt,publicExpiresAt:item.publicExpiresAt}));
 }
 function render(){
  const panel=$('feedbackLookupPanel');panel.hidden=!active||!selected;
  if(panel.hidden)return;
  $('feedbackLookupName').textContent=selected.name;
  const list=$('feedbackLookupRows');
  list.replaceChildren();
  const visible=rows.filter(item=>!Number.isFinite(item.publicExpiresAt)||item.publicExpiresAt-90*DAY>Date.now()-30*DAY);
  if(state==='loading'||state==='error'||!visible.length){
   const text=document.createElement('p');text.className='lookup-message';
   text.textContent=state==='loading'?'캐시백 피드백을 불러오는 중이에요.':state==='error'?'캐시백 피드백을 불러오지 못했어요. 잠시 후 주유소를 다시 선택해 주세요.':'최근 30일간 공유된 캐시백 피드백이 없어요.';
   list.append(text);
  }else for(const item of visible.slice(0,expanded?5:3)){
   const row=document.createElement('div'),status=document.createElement('span'),dot=document.createElement('i'),date=document.createElement('time');
   row.className='lookup-row';status.className='lookup-result '+(item.status==='received'?'received':'not-received');dot.setAttribute('aria-hidden','true');
   status.append(dot,document.createTextNode(item.status==='received'?'받았어요':'못 받았어요'));
   date.dateTime=item.reportedAt;date.textContent=window.Citizen.time(item.reportedAt);row.append(status,date);list.append(row);
  }
  const more=$('feedbackLookupMore');more.hidden=state!=='ready'||visible.length<=3;
  more.setAttribute('aria-expanded',String(expanded));$('feedbackLookupMoreText').textContent=expanded?'접기':'더 보기';
  panel.setAttribute('aria-busy',String(state==='loading'));
  fitTitle();
  schedulePlacement();
 }
 function fitTitle(){
  const title=$('feedbackLookupName');title.style.removeProperty('font-size');
  if(!selected||$('feedbackLookupPanel').hidden)return;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');if(!context)return;
  const style=getComputedStyle(title),base=parseFloat(style.fontSize);context.font=style.fontWeight+' '+base+'px '+style.fontFamily;
  const width=context.measureText(title.textContent).width;
  if(width>title.clientWidth)title.style.fontSize=Math.max(base*.875,base*title.clientWidth/width)+'px';
 }
 function placePanel(){
  placementFrame=null;const panel=$('feedbackLookupPanel'),map=$('map');
  if(!active||!selected||panel.hidden||!map)return;
  for(const property of ['left','bottom','max-width'])panel.style.removeProperty(property);
  panel.style.removeProperty('--lookup-logo-max-width');
  fitTitle();
  const area=map.getBoundingClientRect(),base=panel.getBoundingClientRect(),style=getComputedStyle(panel),gap=6;
  if(!area.width||!base.width)return;
  const boxes=[];
  for(const node of map.querySelectorAll('a,img,[class*="logo"],[class*="copyright"],[class*="attribution"]')){
   const identity=[node.getAttribute('alt'),node.getAttribute('aria-label'),node.className].join(' ');
   const providerLink=node.tagName==='A'&&/naver\.(com|net)|navercorp\.com/i.test(node.getAttribute('href')||'');
   const logoImage=/logo|copyright|attribution/i.test(node.getAttribute('src')||'');
   if(!providerLink&&!logoImage&&!/naver|copyright|attribution|logo|네이버/i.test(identity))continue;
   const rect=node.getBoundingClientRect();
   if(rect.width&&rect.height&&rect.right>area.left&&rect.left<area.right&&rect.bottom>area.top&&rect.top<area.bottom)boxes.push(rect);
  }
  // SDK 표기를 식별할 수 없는 경우 하단의 최소 안전 영역을 사용합니다.
  if(!boxes.length)boxes.push({left:area.left,right:area.right,top:area.bottom-30,bottom:area.bottom});
  const overlaps=(a,b)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  if(!boxes.some(box=>overlaps(base,box)))return;
  const padding=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+parseFloat(style.borderLeftWidth)+parseFloat(style.borderRightWidth);
  let minimum=0;
  for(const row of panel.querySelectorAll('.lookup-row')){
   minimum=Math.max(minimum,row.querySelector('.lookup-result').scrollWidth+row.querySelector('time').scrollWidth+parseFloat(getComputedStyle(row).columnGap)+padding);
  }
  const title=$('feedbackLookupName'),period=panel.querySelector('.lookup-period'),context=document.createElement('canvas').getContext('2d'),titleStyle=getComputedStyle(title);
  if(context){context.font=titleStyle.fontWeight+' 14px '+titleStyle.fontFamily;minimum=Math.max(minimum,context.measureText(title.textContent).width/2+period.scrollWidth+6+padding);}
  minimum=Math.min(base.width,minimum);
  let intervals=[[area.left+gap,area.right-gap]];
  for(const box of boxes.filter(box=>base.top<box.bottom+gap&&base.bottom>box.top-gap)){
   intervals=intervals.flatMap(([left,right])=>box.right+gap<=left||box.left-gap>=right?[[left,right]]:[[left,Math.min(right,box.left-gap)],[Math.max(left,box.right+gap),right]].filter(([a,b])=>b>a));
  }
  const candidates=intervals.filter(([left,right])=>right-left>=minimum).map(([left,right])=>({left:Math.max(left,Math.min(base.left,right-Math.min(base.width,right-left))),width:Math.min(base.width,right-left)}));
  candidates.sort((a,b)=>(Number(b.width>=base.width)-Number(a.width>=base.width))||Math.abs(a.left-base.left)-Math.abs(b.left-base.left));
  if(candidates.length){
   const candidate=candidates[0];panel.style.left=(parseFloat(style.left)+candidate.left-base.left)+'px';panel.style.setProperty('--lookup-logo-max-width',candidate.width+'px');panel.style.maxWidth=candidate.width+'px';fitTitle();
  }
  const current=panel.getBoundingClientRect(),blocked=boxes.filter(box=>overlaps(current,box));
  if(blocked.length)panel.style.bottom=(parseFloat(style.bottom)+current.bottom-Math.min(...blocked.map(box=>box.top))+gap)+'px';
 }
 function schedulePlacement(){if(placementFrame===null)placementFrame=requestAnimationFrame(placePanel);}
 async function load(id){
  if(pending.has(id))return pending.get(id);
  const request=window.Citizen.list({stationId:id,limit:5}).then(data=>{
   if(!data||!Array.isArray(data.items))throw Error('invalid_response');
   return data.items;
  }).finally(()=>pending.delete(id));pending.set(id,request);return request;
 }
 async function select(station){
  const valid=station&&Number.isSafeInteger(station.id)&&bridge.isStation(station.id)?station:null;
  if(valid?.id===selected?.id&&state!=='error')return;
  const ticket=++version;selected=valid;expanded=false;rows=[];state=valid?'loading':'idle';render();
  if(!active||!valid)return;
  try{const items=await load(valid.id);if(ticket!==version||!active||selected?.id!==valid.id)return;rows=publicRows(items,valid.id);state='ready';}
  catch{if(ticket!==version||!active)return;state='error';rows=[];}
  render();
 }
 function start(){
  if(active)return;active=true;document.body.classList.add('feedback-lookup');$('feedbackLookupBar').hidden=false;
  $('searchInput').setAttribute('aria-label','캐시백 피드백 조회: 주유소명 또는 주소 검색');
  bridge.clearSelection();bridge.enterMap();
 }
 function reset(){
  ++version;active=false;selected=null;expanded=false;rows=[];state='idle';
  $('feedbackLookupPanel').hidden=true;$('feedbackLookupBar').hidden=true;document.body.classList.remove('feedback-lookup');
  $('searchInput').setAttribute('aria-label','주유소명 또는 주소 검색');
 }
 $('feedbackLookupForm').addEventListener('submit',event=>{
  event.preventDefault();const query=$('feedbackLookupSearch').value.trim();if(!query)return;
  $('feedbackLookupSearch').blur();start();bridge.search(query);
 });
 $('feedbackLookupPick').onclick=start;
 $('feedbackLookupExit').onclick=()=>{reset();bridge.clearSelection();};
 $('feedbackLookupMore').onclick=()=>{expanded=!expanded;render();};
 window.addEventListener('resize',()=>{fitTitle();schedulePlacement();});
 window.addEventListener('gasmap:map-view-changed',schedulePlacement);
 $('map').addEventListener('load',schedulePlacement,true);
 if(window.ResizeObserver){const observer=new ResizeObserver(schedulePlacement);observer.observe($('map'));observer.observe($('feedbackLookupPanel'));}
 if(window.MutationObserver)new MutationObserver(schedulePlacement).observe($('map'),{childList:true,subtree:true});
 document.fonts?.ready?.then(()=>{fitTitle();schedulePlacement();});
 return {isActive:()=>active,select,reset};
};
