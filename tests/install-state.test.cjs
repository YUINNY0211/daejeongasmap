const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const script=fs.readFileSync('assets/install-guide.js','utf8');
function fixture({standalone=false,stored={},related,blocked=false}={}){const elements=new Map(),events={},storage=new Map(Object.entries(stored));const e=id=>{if(!elements.has(id))elements.set(id,{hidden:true,open:false,classList:{remove(){}},addEventListener(){},showModal(){this.open=true},close(){this.open=false}});return elements.get(id)};const ctx={navigator:{standalone,...(related?{getInstalledRelatedApps:related}:{})},matchMedia:()=>({matches:standalone,addEventListener(){}}),document:{getElementById:e,querySelectorAll:()=>[],addEventListener(){},visibilityState:'visible'},window:{addEventListener:(k,fn)=>events[k]=fn},localStorage:{getItem:k=>{if(blocked)throw Error();return storage.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error();storage.set(k,v)}}};vm.createContext(ctx);vm.runInContext(script,ctx);return {e,events,storage};}
(async()=>{
 const normal=fixture();assert.equal(normal.e('installPrompt').hidden,false);
 const ios=fixture({standalone:true});assert.equal(ios.e('installPrompt').hidden,true);assert.equal(ios.storage.get('gasmapPwaInstalled'),'1');
 assert.equal(fixture({stored:{gasmapInstallDismissed:'1'}}).e('installPrompt').hidden,true);
 assert.equal(fixture({stored:{gasmapPwaInstalled:'1'}}).e('installPrompt').hidden,true);
 normal.events.appinstalled();assert.equal(normal.e('installPrompt').hidden,true);assert.equal(normal.storage.get('gasmapPwaInstalled'),'1');
 const android=fixture({related:async()=>[{platform:'webapp',url:'https://daejeongasmap.kr/manifest.webmanifest'}]});await new Promise(r=>setImmediate(r));assert.equal(android.e('installPrompt').hidden,true);assert.equal(android.storage.get('gasmapPwaInstalled'),'1');
 const unrelated=fixture({related:async()=>[{platform:'webapp',url:'https://example.com/manifest.json'}]});await new Promise(r=>setImmediate(r));assert.equal(unrelated.e('installPrompt').hidden,false);
 assert.equal(fixture({blocked:true}).e('installPrompt').hidden,false);
 console.log('PASS install state: ordinary browser, iOS standalone, Android related app, installation event, saved dismissal/installed, unrelated app and blocked storage.');
})().catch(e=>{console.error(e);process.exitCode=1});
