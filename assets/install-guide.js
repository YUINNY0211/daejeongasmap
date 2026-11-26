(()=>{
 const $=id=>document.getElementById(id),mode=matchMedia('(display-mode: standalone)');
 const hideKey='gasmapInstallDismissedUntil',hideDuration=168*60*60*1000;
 let deferredPrompt=null,relatedInstalled=null,sessionInstalled=false,ready=false,checkingRelated=false,revision=0,memoryUntil=0;
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const save=(key,value)=>{try{localStorage.setItem(key,String(value));return true;}catch{return false;}};
 const standalone=()=>navigator.standalone===true||mode.matches;
 function dismiss(){const until=Date.now()+hideDuration;if(!save(hideKey,until))memoryUntil=until;update();}
 function migrateDismissal(){
  if(read(hideKey)===null&&read('gasmapInstallDismissed')!==null){
   const until=Date.now()+hideDuration;if(!save(hideKey,until))memoryUntil=until;
  }
 }
 function update(){
  const installed=standalone()||sessionInstalled||relatedInstalled===true;
  $('installPrompt').hidden=!ready||installed||Math.max(memoryUntil,Number(read(hideKey))||0)>Date.now();
  $('installNative').hidden=installed||!deferredPrompt;
 }
 async function checkInstalled(){
  if(checkingRelated){update();return;}
  if(standalone()){ready=true;update();return;}
  if(typeof navigator.getInstalledRelatedApps!=='function'){ready=true;update();return;}
  checkingRelated=true;const ticket=revision;let timer;update();
  try{
   const apps=await Promise.race([navigator.getInstalledRelatedApps(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('install-status-timeout')),2500);})]);
   if(ticket===revision&&Array.isArray(apps)){
    const found=apps.some(app=>app.platform==='webapp'&&app.url==='https://daejeongasmap.kr/manifest.webmanifest');
    if(found){relatedInstalled=true;sessionInstalled=false;save('gasmapPwaInstalled','1');deferredPrompt=null;}
    // An empty result is conclusive only for the configured same-origin Android PWA query.
    else if(location.origin==='https://daejeongasmap.kr'&&/Android/i.test(navigator.userAgent||'')){relatedInstalled=false;sessionInstalled=false;}
   }
  }catch{}finally{clearTimeout(timer);checkingRelated=false;ready=true;update();}
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();++revision;deferredPrompt=event;relatedInstalled=false;sessionInstalled=false;ready=true;update();});
 window.addEventListener('appinstalled',()=>{++revision;sessionInstalled=true;deferredPrompt=null;ready=true;save('gasmapPwaInstalled','1');update();});
 mode.addEventListener?.('change',checkInstalled);
 document.querySelectorAll('[data-install-guide]').forEach(button=>button.addEventListener('click',()=>{
  const menu=$('topMenu');if(menu){menu.hidden=true;menu.classList.remove('open');$('drawerBackdrop').hidden=true;}
  if(!$('installGuide').open){
   const dialog=$('installGuide');
   dialog.hidden=false;dialog.showModal();
  }
 }));
 $('installGuideClose').onclick=()=>$('installGuide').close();
 $('installGuide').addEventListener('close',()=>{$('installGuide').hidden=true;});
 $('installDismiss').onclick=dismiss;
 $('installNative').onclick=async()=>{
  const prompt=deferredPrompt;if(!prompt)return;
  deferredPrompt=null;update();
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='dismissed')dismiss();}catch{}
 };
 window.addEventListener('pageshow',checkInstalled);
 document.addEventListener?.('visibilitychange',()=>{if(document.visibilityState==='visible')checkInstalled();});
 window.addEventListener('storage',event=>{if([hideKey,'gasmapInstallDismissed'].includes(event.key)){migrateDismissal();update();}});
 migrateDismissal();
 checkInstalled();
})();
