const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),vm=require('vm');
const remoteBase='bb14c631ec198d8136e9f5c3120e1008154f8226';
const baseRef=cp.spawnSync('git',['cat-file','-e',remoteBase+'^{commit}']).status===0?remoteBase:'9bdabd3';
const base=p=>cp.execFileSync('git',['show',baseRef+':'+p],{maxBuffer:16000000});const read=p=>fs.readFileSync(p),norm=x=>x.toString().replace(/\r\n/g,'\n');
const html=read('index.html').toString(),old=base('index.html').toString();
for(const pattern of [/const stationData=(\[[^\n]*\]);/,/const faqList=\[[\s\S]*?\n\];/,/<nav id="topMenu"[\s\S]*?<\/nav>/,/<nav class="dock"[\s\S]*?<\/nav>/,/<section id="site-guide"[\s\S]*?<\/section>/])assert.equal(html.match(pattern)[0],old.match(pattern)[0]);
const protectedFiles=cp.execFileSync('git',['ls-tree','-r','--name-only',baseRef],{encoding:'utf8'}).trim().split('\n').filter(p=>/^(?:about|notice|sources|privacy|terms|contact|content|assets\/pwa)\//.test(p)||['faq.html','sitemap.xml','robots.txt','ui-config.js','fuel-data.js','pin-visibility.js','citizen-client.js','approved-ui.css','citizen-ui.css'].includes(p)||p.startsWith('functions/')&&p!=='functions/_lib/citizen.js');
for(const p of protectedFiles){if(/\.png$/.test(p))assert.ok(read(p).equals(base(p)),p+' must be byte-identical');else assert.equal(norm(read(p)),norm(base(p)),p+' must be preserved');}
const api=norm(read('functions/_lib/citizen.js'));assert.equal(api,norm(base('functions/_lib/citizen.js')).replace('message=text(b.message,5,100);',"message=text(b.message??'',0,Number.POSITIVE_INFINITY);"));
assert.ok(!/maxlength=|minlength=|0\/100|suggestionCount/.test(html));assert.ok(!html.includes('웹 앱으로 열기'));assert.ok(!html.includes('오른쪽 상단의 <strong>추가'));
for(const name of ['safari-share.jpg','safari-more.jpg','safari-add-home.jpg'])assert.ok(!fs.existsSync('assets/install-guide/'+name));
for(const p of ['index.html','assets/ui-test.css','assets/install-guide.js'])assert.ok(!/install-screenshot|safari-(?:share|more|add-home)\.jpg/.test(read(p).toString()));
const fq=vm.runInNewContext('('+html.match(/const faqList=(\[[\s\S]*?\n\]);/)[1]+')');assert.equal(fq.length,11);assert.equal((read('faq.html').toString().match(/<summary>/g)||[]).length,11);
const oldManifest=JSON.parse(base('manifest.webmanifest')),newManifest=JSON.parse(read('manifest.webmanifest'));delete newManifest.related_applications;assert.deepEqual(newManifest,oldManifest);
console.log('PASS preservation: '+protectedFiles.length+' protected files; exact stations/FAQ/menu/dock/home cards; only API message validation differs; installation references removed.');
