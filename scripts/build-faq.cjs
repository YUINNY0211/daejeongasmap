// Run after changing the approved faqList in index.html. No runtime fetch is needed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=home.match(/const faqList=(\[[\s\S]*?\r?\n\]);/);
if(!source)throw Error('Approved faqList not found');
const faq=vm.runInNewContext('('+source[1]+')',Object.create(null),{timeout:1000});
if(faq.length!==11)throw Error('Expected exactly 11 approved questions');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sections=[faq.slice(0,4),faq.slice(4,8),faq.slice(8,11)].map((items,p)=>`<section class="swipe-slide" aria-label="자주 묻는 질문 ${p+1}/3"><h2>자주 묻는 질문 (${p+1}/3)</h2>${items.map((item,i)=>`<details class="faq-item" name="gasmap-faq" id="faq-${p*4+i+1}"><summary>${esc(item.q)}</summary><div class="faq-answer">${item.a}</div></details>`).join('')}</section>`).join('\n');
const menu=[['about','사이트 소개'],['notice','공지사항'],['sources','정보 출처 및 갱신 기준'],['faq','자주 묻는 질문(Q&A)'],['privacy','개인정보처리방침'],['terms','이용약관'],['contact','운영자 문의']].map(([slug,label])=>`<a href="/${slug}"${slug==='faq'?' aria-current="page"':''}>${label}</a>`).join('');
const html=`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
<title>자주 묻는 질문(Q&A) | 대전 주유소 지도</title>
<meta name="description" content="대전 주유소 지도의 자주 묻는 질문 11개와 답변입니다. 온통대전 캐시백, 주유소 정보, LPG 충전소, 오피넷, 지도 검색 및 시민 제보 이용 방법을 확인하세요.">
<link rel="canonical" href="https://daejeongasmap.kr/faq">
<link rel="stylesheet" href="/assets/info-pages.css?v=f066bfa70865"><link rel="stylesheet" href="/assets/faq-page.css">
<script defer src="/assets/faq-page.js"></script>
</head><body class="info-page faq-page">
<a class="skip-link" href="/faq#content">본문 바로가기</a>
<header class="page-header"><a class="page-home" href="/" aria-label="처음 화면으로"><span class="page-home-arrow" aria-hidden="true">←</span><span class="page-home-label">처음 화면으로</span></a><div class="article-heading"><p>🗺️ 대전 주유소 지도</p><h1>자주 묻는 질문(Q&A)</h1></div></header>
<main id="content" class="page-content"><div class="swipe-track faq-track" id="faqTrack">${sections}</div>
<nav class="swipe-nav" aria-label="질문 페이지" hidden><button class="swipe-btn" id="faqPrev" type="button">이전</button><div class="swipe-dots">${[1,2,3].map(n=>`<button class="swipe-dot" type="button" aria-label="${n}페이지" data-page="${n-1}"></button>`).join('')}</div><span id="faqStatus" role="status" aria-live="polite"></span><button class="swipe-btn" id="faqNext" type="button">다음</button></nav>
</main><nav class="page-navigation" aria-label="전체메뉴">${menu}</nav><footer class="page-footer"><p>대전 주유소 지도 · 독립 민간 정보 서비스</p></footer>
</body></html>
`;
fs.writeFileSync(path.join(root,'faq.html'),html);
console.log('Built /faq with 11 unchanged answers (4/4/3).');
