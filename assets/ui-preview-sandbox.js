// UI review only. No fetch, production API calls or server writes are made here.
(()=>{
 if(window.GAS_UI?.previewSandbox!==true||!location.hostname.endsWith('.ontongdaejeongasstation.pages.dev'))return;
 const original=window.Citizen,key='gasmap-ui-preview-v1',now=()=>Date.now();let state;
 try{state=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 if(!state||!Array.isArray(state.reports)||!Array.isArray(state.suggestions))state={reports:[],suggestions:[],seeded:false,next:900100};
 function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
 const time=ms=>new Date(ms+9*3600000).toISOString().slice(0,16)+'+09:00';
 function seed(){
  if(state.seeded)return;const stations=window.GasMap?.stations;if(!stations?.length)return;
  state.reports=stations.slice(0,7).map((s,i)=>({id:900007-i,stationId:s.id,stationName:s.name,status:i%2?'not_received':'received',created:now()-i*60000,reportedAt:time(now()-i*60000)}));
  state.seeded=true;save();
 }
 const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
 window.Citizen={...original,
  config:async()=>({enabled:true,localPreview:false,uiPreview:true}),
  async list({stationId,limit=5,before}={}){
   await Promise.resolve();seed();const rows=state.reports.filter(r=>(!stationId||r.stationId===stationId)&&(!before||r.id<Number(before))).sort((a,b)=>b.id-a.id);
   const items=rows.slice(0,limit).map(({manageToken,...r})=>r);return {items,nextCursor:rows.length>limit?String(items.at(-1).id):null};
  },
  async syncOwnership(){let keys={};try{keys=JSON.parse(localStorage.getItem('citizenReportKeys')||'{}');}catch{}return Object.fromEntries(Object.entries(keys).filter(([id])=>state.reports.some(r=>r.id===Number(id))));},
  async send(kind,data){
   seed();
   if(kind==='reports'){
    const s=window.GasMap?.stations.find(s=>s.id===data.stationId);if(!s)throw Error('unknown_station');
    const created=now(),manageToken=token(),id=state.next++;
    state.reports.unshift({id,stationId:s.id,stationName:s.name,status:data.status,created,reportedAt:time(created),manageToken,revision:0});save();
    return {ok:true,reportId:id,manageToken,created,revision:0,manageExpiresAt:created+90*86400000};
   }
   if(kind==='manage'){
    const r=state.reports.find(r=>r.id===data.reportId&&r.manageToken===data.manageToken);if(!r)throw Error('not_found');
    if(data.operation==='cancel')state.reports=state.reports.filter(row=>row!==r);else{r.status=data.status;r.revision++;}
    save();return {ok:true,revision:r.revision};
   }
   if(kind==='suggestions'){state.suggestions.push({...data,created:now()});save();return {ok:true};}
   throw Error('not_enabled');
  }
 };
 const notice=document.createElement('div');notice.id='uiPreviewNotice';notice.setAttribute('role','status');
 notice.textContent='테스트 버전 · 예시 피드백과 입력 내용은 이 브라우저에서만 사용되며 운영 데이터에 반영되지 않습니다.';
 document.body.prepend(notice);
})();
