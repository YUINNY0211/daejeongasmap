(()=>{
 const track=document.getElementById('faqTrack'),nav=document.querySelector('.swipe-nav');
 const slides=[...track.children],dots=[...nav.querySelectorAll('[data-page]')];
 const prev=document.getElementById('faqPrev'),next=document.getElementById('faqNext');
 let current=0;
 function update(){current=slides.reduce((best,slide,i)=>Math.abs(slide.offsetLeft-slides[0].offsetLeft-track.scrollLeft)<Math.abs(slides[best].offsetLeft-slides[0].offsetLeft-track.scrollLeft)?i:best,0);prev.disabled=current===0;next.disabled=current===2;dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===current)));document.getElementById('faqStatus').textContent=(current+1)+' / 3';}
 function go(page){page=Math.max(0,Math.min(2,page));track.scrollTo({left:slides[page].offsetLeft-slides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
 document.body.classList.add('faq-enhanced');nav.hidden=false;
 prev.onclick=()=>go(current-1);next.onclick=()=>go(current+1);dots.forEach(dot=>dot.onclick=()=>go(Number(dot.dataset.page)));
 track.addEventListener('scroll',update,{passive:true});
 window.addEventListener('resize',()=>{go(current);});
 track.querySelectorAll('details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)track.querySelectorAll('details[open]').forEach(other=>{if(other!==item)other.open=false;});}));
 track.addEventListener('focusin',event=>{const slide=event.target.closest('.swipe-slide');if(slide)go(slides.indexOf(slide));});
 update();
})();
