const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),vm=require('vm'),assert=require('assert/strict');
const original=fs.readFileSync('index.html'),faqHtml=fs.readFileSync('faq.html'),source=original.toString().match(/const faqList=(\[[\s\S]*?\r?\n\]);/)[1],items=vm.runInNewContext('('+source+')');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gasmap-faq-edit-'));fs.mkdirSync(path.join(temp,'scripts'));fs.copyFileSync('scripts/build-faq.cjs',path.join(temp,'scripts/build-faq.cjs'));
function build(answer){items[0].a=answer;fs.writeFileSync(path.join(temp,'index.html'),'const faqList='+JSON.stringify(items,null,2)+';');cp.execFileSync(process.execPath,['scripts/build-faq.cjs'],{cwd:temp});return fs.readFileSync(path.join(temp,'faq.html'),'utf8');}
let h=build('<p>검증 문단 A</p><p>검증 문단 B</p><img src="/test-only.png" alt="검증">');assert.ok(h.includes('검증 문단 A'));assert.ok(h.includes('/test-only.png'));
h=build('<p>검증 문단 B</p>');assert.ok(!h.includes('검증 문단 A'));assert.ok(!h.includes('/test-only.png'));
h=build('');assert.match(h,/<div class="faq-answer"><\/div>/);assert.ok(!h.includes('검증 문단 B'));
h=build('<p>전체 교체 완료</p>');assert.ok(h.includes('전체 교체 완료'));assert.ok(!h.includes('검증 문단'));assert.equal((h.match(/<summary>/g)||[]).length,11);
assert.ok(original.equals(fs.readFileSync('index.html')));assert.ok(faqHtml.equals(fs.readFileSync('faq.html')));
console.log('PASS isolated static FAQ HTML save/edit/paragraph+image removal/whole-body deletion/replacement and rebuild; production source untouched. Fixture: '+temp);
