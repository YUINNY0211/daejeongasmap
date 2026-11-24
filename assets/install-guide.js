(()=>{
 const $=id=>document.getElementById(id),mode=matchMedia('(display-mode: standalone)');
 let deferredPrompt=null,installed=navigator.standalone===true||mode.matches,checkingRelated=false;
 const read=key=>{try{return localStorage.getItem(key)==='1';}catch{return false;}};
 const save=key=>{try{localStorage.setItem(key,'1');}catch{}};
 function update(){
  if(navigator.standalone===true||mode.matches){installed=true;save('gasmapPwaInstalled');}
  $('installPrompt').hidden=checkingRelated||installed||read('gasmapPwaInstalled')||read('gasmapInstallDismissed');
  $('installNative').hidden=installed||!deferredPrompt;
 }
 async function checkInstalled(){
  update();if(installed||typeof navigator.getInstalledRelatedApps!=='function'||checkingRelated)return;
  checkingRelated=true;update();
  try{
   const apps=await navigator.getInstalledRelatedApps();
   if(apps.some(app=>app.platform==='webapp'&&app.url==='https://daejeongasmap.kr/manifest.webmanifest')){installed=true;save('gasmapPwaInstalled');deferredPrompt=null;}
  }catch{}finally{checkingRelated=false;update();}
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;update();});
 window.addEventListener('appinstalled',()=>{installed=true;deferredPrompt=null;save('gasmapPwaInstalled');update();});
 mode.addEventListener?.('change',update);
 document.querySelectorAll('[data-install-guide]').forEach(button=>button.addEventListener('click',()=>{
  const menu=$('topMenu');if(menu){menu.hidden=true;menu.classList.remove('open');$('drawerBackdrop').hidden=true;}
  if(!$('installGuide').open){
   const dialog=$('installGuide');
   dialog.hidden=false;dialog.showModal();
  }
 }));
 $('installGuideClose').onclick=()=>$('installGuide').close();
 $('installGuide').addEventListener('close',()=>{$('installGuide').hidden=true;});
 $('installDismiss').onclick=()=>{save('gasmapInstallDismissed');update();};
 $('installNative').onclick=async()=>{
  const prompt=deferredPrompt;if(!prompt)return;
  deferredPrompt=null;update();
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='dismissed'){save('gasmapInstallDismissed');update();}}catch{}
 };
 window.addEventListener('pageshow',checkInstalled);
 document.addEventListener?.('visibilitychange',()=>{if(document.visibilityState==='visible')checkInstalled();});
 window.addEventListener('storage',event=>{if(['gasmapPwaInstalled','gasmapInstallDismissed'].includes(event.key))update();});
 checkInstalled();
})();
