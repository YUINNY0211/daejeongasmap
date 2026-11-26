(() => {
const bodies={"updates":"<ol class=\"update-list\" aria-label=\"최신 업데이트\"><li><article class=\"update-record\" aria-labelledby=\"update-latest-title\"><header class=\"update-heading\"><span class=\"update-icon\" aria-hidden=\"true\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.9\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 9a8 8 0 0 0-14-3L3 9m0-5v5h5M4 15a8 8 0 0 0 14 3l3-3m0 5v-5h-5\"/></svg></span><div><time datetime=\"2026-11-26\">2026.11.26</time><h2 id=\"update-latest-title\">서비스 편의 기능 개선 및 정보 갱신</h2></div></header><section class=\"update-services\"><ul><li>현재 위치 확인 기능 추가</li><li>주유소별 최근 30일 캐시백 피드백 조회 기능 추가</li><li>주유소 영업시간 정보 추가</li><li>시민 의견을 반영한 지도 이용 편의성 개선</li><li>온통대전 캐시백 가맹점 정보 최신화</li></ul><p class=\"detail\">최종 확인일: 2026.11.26</p></section></article></li></ol>","cashback":"<section class=\"guide-slides\" aria-label=\"캐시백 확인 방법 슬라이드\" tabindex=\"0\"><div class=\"guide-track\"><section class=\"guide-slide\" aria-label=\"1단계\"><h2>나의캐시 메뉴 열기</h2><a class=\"guide-image-link\" href=\"/assets/cashback-step-1.png\" target=\"_blank\" rel=\"noopener\" aria-label=\"1단계 이미지 확대\"><img class=\"guide-image\" src=\"/assets/cashback-step-1.png\" alt=\"온통대전 앱 메인 화면에서 나의캐시를 선택하는 위치\"></a><p>온통대전 앱을 실행한 뒤 나의캐시 메뉴를 선택합니다. 나의캐시에서는 충전금과 캐시백 등 이용 중인 잔액 정보를 확인할 수 있습니다.</p></section><section class=\"guide-slide\" aria-label=\"2단계\"><h2>이용내역 선택하기</h2><a class=\"guide-image-link\" href=\"/assets/cashback-step-2.png\" target=\"_blank\" rel=\"noopener\" aria-label=\"2단계 이미지 확대\"><img class=\"guide-image\" src=\"/assets/cashback-step-2.png\" alt=\"나의캐시 펼침 화면 하단의 이용내역 메뉴 위치\"></a><p>나의캐시 화면에서 이용내역을 선택합니다. 이곳에서 온통대전으로 결제한 내역과 캐시백 적립 내역을 확인할 수 있습니다.</p></section><section class=\"guide-slide\" aria-label=\"3단계\"><h2>사용내역에서 결제 확인하기</h2><a class=\"guide-image-link\" href=\"/assets/cashback-step-3.png\" target=\"_blank\" rel=\"noopener\" aria-label=\"3단계 이미지 확대\"><img class=\"guide-image\" src=\"/assets/cashback-step-3.png\" alt=\"이용내역 화면의 사용내역 탭과 결제 내역\"></a><p>사용내역 탭에서는 온통대전으로 결제한 기록을 확인할 수 있습니다. 주유소 방문 후 해당 결제가 정상적으로 기록되었는지 먼저 확인해 보세요.</p></section><section class=\"guide-slide\" aria-label=\"4단계\"><h2>캐시백 탭에서 적립 금액 확인하기</h2><a class=\"guide-image-link\" href=\"/assets/cashback-step-4.png\" target=\"_blank\" rel=\"noopener\" aria-label=\"4단계 이미지 확대\"><img class=\"guide-image\" src=\"/assets/cashback-step-4.png\" alt=\"이용내역 화면의 캐시백 탭과 실제 적립 금액\"></a><p>캐시백 탭에서는 결제 후 실제로 적립된 캐시백 내역과 금액을 확인할 수 있습니다.</p><p>결제 내역이 표시되는 것과 캐시백이 실제 적립되는 것은 서로 다르므로 두 항목을 구분해서 확인하는 것이 중요합니다.</p></section></div></section><div class=\"slide-controls\"><button type=\"button\" id=\"guidePrevious\">이전</button><span id=\"guideCounter\" aria-live=\"polite\">1 / 4</span><button type=\"button\" id=\"guideNext\">다음</button></div><nav class=\"guide-dots\" aria-label=\"슬라이드 선택\"><button type=\"button\" aria-label=\"1번 슬라이드\"></button><button type=\"button\" aria-label=\"2번 슬라이드\"></button><button type=\"button\" aria-label=\"3번 슬라이드\"></button><button type=\"button\" aria-label=\"4번 슬라이드\"></button></nav><p class=\"example-note\">이미지에 표시된 날짜와 금액은 앱 사용 방법을 설명하는 예시이며, 현재 혜택이나 개별 결제의 캐시백 지급을 의미하지 않습니다.</p>"};
const modal=document.getElementById('modal');
const content=document.getElementById('modalContent');
const title=document.getElementById('modalTitle');
let opener,observer;
function cleanup(){
  observer?.disconnect();observer=null;
  delete modal.dataset.resource;
  content.classList.remove('cashback-guide');
}
function close(){
  modal.hidden=true;
  cleanup();
  opener?.focus({preventScroll:true});
}
new MutationObserver(()=>{if(modal.hidden&&modal.dataset.resource)close();}).observe(modal,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('click',e=>{
  const entry=e.target.closest('[data-page="updates"],a.cashback-entry');
  if(!entry)return;
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();e.stopImmediatePropagation();cleanup();
  opener=entry;
  const key=entry.matches('.cashback-entry')?'cashback':'updates';
  modal.dataset.resource=key;
  const icon=entry.querySelector('.home-menu-icon').cloneNode(true);
  title.replaceChildren(icon,document.createTextNode(key==='cashback'?'온통대전 캐시백 확인 방법':'업데이트 내역'));
  content.innerHTML=bodies[key];
  if(key==='cashback')content.classList.add('cashback-guide');
  else content.classList.remove('cashback-guide');
  const link=document.createElement('a');
  link.href=key==='cashback'?'/cashback-guide/':'/updates/';
  link.textContent='전체 안내 페이지 보기';link.className='resource-page-link';content.append(link);
  modal.hidden=false;
  modal.querySelector('.modal-inner').scrollTop=0;
  document.getElementById('modalClose').focus({preventScroll:true});
  if(key==='cashback')initSlides();
},true);
// Clear resource-specific classes before any of the original menus opens.
document.addEventListener('click',e=>{
  if(e.target.closest('[data-page]:not([data-page="updates"])')){cleanup();content.classList.remove('cashback-guide');}
},true);
document.addEventListener('keydown',e=>{
  if(!modal.hidden&&modal.dataset.resource&&e.key==='Escape'){e.preventDefault();close();}
});
function initSlides(){
  const track=content.querySelector('.guide-track');
  const slides=[...content.querySelectorAll('.guide-slide')];
  const dots=[...content.querySelectorAll('.guide-dots button')];
  const previous=content.querySelector('#guidePrevious'),next=content.querySelector('#guideNext');
  let index=0,start;
  function show(value){
    index=Math.max(0,Math.min(slides.length-1,value));
    track.style.transform=`translateX(-${index*100}%)`;
    slides.forEach((slide,i)=>{slide.setAttribute('aria-current',String(i===index));slide.inert=i!==index;});
    dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));
    previous.disabled=index===0;next.textContent=index===slides.length-1?'닫기':'다음';
    content.querySelector('#guideCounter').textContent=`${index+1} / ${slides.length}`;
    track.style.height=`${slides[index].scrollHeight}px`;
  }
  previous.onclick=()=>show(index-1);
  next.onclick=()=>index===slides.length-1?close():show(index+1);
  dots.forEach((dot,i)=>dot.onclick=()=>show(i));
  track.addEventListener('touchstart',e=>{start=e.changedTouches[0];},{passive:true});
  track.addEventListener('touchend',e=>{
    if(!start)return;
    const dx=e.changedTouches[0].clientX-start.clientX,dy=e.changedTouches[0].clientY-start.clientY;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))show(index+(dx<0?1:-1));start=null;
  },{passive:true});
  content.querySelector('.guide-slides').onkeydown=e=>{
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}
  };
  observer=new ResizeObserver(()=>show(index));observer.observe(content.querySelector('.guide-slides'));
  content.querySelectorAll('img').forEach(img=>img.onload=()=>show(index));
  show(0);
}

})();
