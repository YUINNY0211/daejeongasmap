(() => {
  const root = document.querySelector('.cashback-guide');
  if (!root) return;
  const track = root.querySelector('.guide-track');
  const slides = [...root.querySelectorAll('.guide-slide')];
  const dots = [...root.querySelectorAll('.guide-dots button')];
  const previous = root.querySelector('#guidePrevious');
  const next = root.querySelector('#guideNext');
  const counter = root.querySelector('#guideCounter');
  let index = 0;
  function show(value) {
    index = Math.max(0, Math.min(slides.length - 1, value));
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.setAttribute('aria-current', String(i === index));
      slide.inert = i !== index;
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    previous.disabled = index === 0;
    next.textContent = index === slides.length - 1 ? '안내 종료' : '다음';
    counter.textContent = `${index + 1} / ${slides.length}`;
    track.style.height = `${slides[index].scrollHeight}px`;
  }
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => index === slides.length - 1 ? location.assign('/#site-guide') : show(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  let start;
  track.addEventListener('touchstart', e => { start = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    start = null;
  }, { passive: true });
  root.querySelector('.guide-slides').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(index + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') location.assign('/#site-guide'); });
  root.classList.remove('no-guide-js');
  new ResizeObserver(() => show(index)).observe(root.querySelector('.guide-slides'));
  root.querySelectorAll('img').forEach(img => img.addEventListener('load', () => show(index)));
  show(0);
})();
