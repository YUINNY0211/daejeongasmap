(()=>{
 const $=id=>document.getElementById(id),mode=matchMedia('(display-mode: standalone)');
 let deferredPrompt=null,installed=navigator.standalone===true||mode.matches;
 const read=key=>{try{return localStorage.getItem(key)==='1';}catch{return false;}};
 const save=key=>{try{localStorage.setItem(key,'1');}catch{}};
 function update(){
  if(navigator.standalone===true||mode.matches){installed=true;save('gasmapPwaInstalled');}
  $('installPrompt').hidden=installed||read('gasmapPwaInstalled')||read('gasmapInstallDismissed');
  $('installNative').hidden=installed||!deferredPrompt;
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredPrompt=event;update();});
 window.addEventListener('appinstalled',()=>{installed=true;deferredPrompt=null;save('gasmapPwaInstalled');update();});
 mode.addEventListener?.('change',update);
 document.querySelectorAll('[data-install-guide]').forEach(button=>button.addEventListener('click',()=>{
  const menu=$('topMenu');if(menu){menu.hidden=true;menu.classList.remove('open');$('drawerBackdrop').hidden=true;}
  if(!$('installGuide').open){
   const dialog=$('installGuide');
   dialog.querySelectorAll('template.install-screenshot-source').forEach(template=>{const fragment=template.content.cloneNode(true);fragment.firstElementChild.dataset.installLoaded='true';template.after(fragment);});
   dialog.hidden=false;dialog.showModal();
  }
 }));
 $('installGuideClose').onclick=()=>$('installGuide').close();
 $('installGuide').addEventListener('close',()=>{$('installGuide').hidden=true;$('installGuide').querySelectorAll('[data-install-loaded]').forEach(image=>image.remove());});
 $('installDismiss').onclick=()=>{save('gasmapInstallDismissed');update();};
 $('installNative').onclick=async()=>{
  const prompt=deferredPrompt;if(!prompt)return;
  deferredPrompt=null;update();
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='dismissed'){save('gasmapInstallDismissed');update();}}catch{}
 };
 update();
})();
