// Run after changing the approved faqList in index.html. No runtime fetch is needed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=home.match(/const faqList=(\[[\s\S]*?\r?\n\]);/);
if(!source)throw Error('Approved faqList not found');
const faq=vm.runInNewContext('('+source[1]+')',Object.create(null),{timeout:1000});
if(faq.length!==11)throw Error('Expected exactly 11 approved questions');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const groups=[['⛽ 주유소 정보 및 캐시백',0,6],['📍 지도 및 편의 기능',6,8],['💬 시민 참여 및 서비스 이용',8,11]];
const sections=groups.map(([title,start,end])=>'<section class="faq-category"><h2>'+title+'</h2>'+faq.slice(start,end).map((item,i)=>'<details class="faq-item"'+' name="independent-faq"'+'><summary>'+esc(item.q)+'</summary><div class="faq-answer">'+item.a.replace(/<strong>('<a[^>]+>의견 보내기<\/a>')<\/strong>/g,'$1').replace(/href="#dockReport" data-faq-target="report"/g,'href="/#map-section"').replace(/href="#opinetCard" data-faq-target="opinet"/g,'href="/#opinetCard"')+'</div></details>').join('')+'</section>').join('\n');
const menu=[['about','사이트 소개'],['notice','공지사항'],['sources','정보 출처 및 갱신 기준'],['faq','자주 묻는 질문(Q&A)'],['privacy','개인정보처리방침'],['terms','이용약관'],['contact','운영자 문의']].map(([slug,label])=>`<a href="/${slug}"${slug==='faq'?' aria-current="page"':''}>${label}</a>`).join('');
const html=`<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
<title>자주 묻는 질문(Q&A) | 대전 주유소 지도</title>
<meta name="description" content="대전 주유소 지도의 자주 묻는 질문 11개와 답변입니다. 온통대전 캐시백, 주유소 정보, LPG 충전소, 오피넷, 지도 검색 및 시민 제보 이용 방법을 확인하세요.">
<link rel="canonical" href="https://daejeongasmap.kr/faq">
<link rel="stylesheet" href="/assets/info-pages.css?v=f066bfa70865"><link rel="stylesheet" href="/assets/faq-page.css">

<script defer src="/assets/faq-accordion.js?v=1"></script>
</head><body class="info-page faq-page">
<a class="skip-link" href="/faq#content">본문 바로가기</a>
<header class="page-header"><a class="page-home" href="/" aria-label="처음 화면으로"><span class="page-home-arrow" aria-hidden="true">←</span><span class="page-home-label">처음 화면으로</span></a><div class="article-heading"><p>🗺️ 대전 주유소 지도</p><h1>자주 묻는 질문(Q&A)</h1></div></header>
<main id="content" class="page-content"><p>대전 주유소 지도 이용과 온통대전 캐시백에 대해 자주 묻는 질문을 안내합니다.</p><hr><div class="faq-accordion">${sections}</div>
</main><nav class="page-navigation" aria-label="전체메뉴">${menu}</nav><footer class="page-footer"><p>대전 주유소 지도 · 독립 민간 정보 서비스</p></footer>
</body></html>
`;
fs.writeFileSync(path.join(root,'faq.html'),html);
console.log('Built /faq with 11 answers in native HTML accordion.');
