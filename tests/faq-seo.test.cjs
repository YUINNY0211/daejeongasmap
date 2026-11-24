const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const home=fs.readFileSync('index.html','utf8'),html=fs.readFileSync('faq.html','utf8');
const baseline=cp.execFileSync('git',['show','f5b1a3c:index.html'],{encoding:'utf8'});
const source=h=>h.match(/const faqList=(\[[\s\S]*?\r?\n\]);/)[1];
assert.equal(source(home),source(baseline),'faqList must remain byte-for-byte unchanged');
const faq=vm.runInNewContext('('+source(baseline)+')');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
const entries=[...html.matchAll(/<summary>([\s\S]*?)<\/summary><div class="faq-answer">([\s\S]*?)<\/div>/g)];
assert.equal(entries.length,11);entries.forEach((m,i)=>{assert.equal(decode(m[1]),faq[i].q);assert.equal(m[2],faq[i].a);});
assert.deepEqual([...html.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(m=>(m[0].match(/<details /g)||[]).length),[4,4,3]);
assert.match(html,/<title>자주 묻는 질문\(Q&A\) \| 대전 주유소 지도<\/title>/);assert.match(html,/<meta name="description" content="[^"]+">/);assert.match(html,/<link rel="canonical" href="https:\/\/daejeongasmap.kr\/faq">/);assert.match(html,/<base href="\/">/);
assert.match(fs.readFileSync('sitemap.xml','utf8'),/<loc>https:\/\/daejeongasmap.kr\/faq<\/loc>/);assert.match(fs.readFileSync('robots.txt','utf8'),/Sitemap: https:\/\/daejeongasmap.kr\/sitemap.xml/);
const newLink='<a href="/faq"><span aria-hidden="true">❓</span> 자주 묻는 질문(Q&A)</a>';
assert.ok(home.includes(newLink),'Keep the approved FAQ link');
assert.match(home,/정보 출처 및 갱신 기준<\/a><a href="\/faq">/);
for(const folder of ['about','notice','sources','privacy','terms','contact','content']){
 assert.equal(cp.execFileSync('git',['diff','f5b1a3c','--',folder],{encoding:'utf8'}),'','Protected folder changed: '+folder);
}
console.log('PASS: 11 exact questions/HTML answers, 4/4/3, SEO, approved FAQ link and protected pages/content unchanged.');
