const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8'),code=html.slice(html.indexOf('let stationHistoryActive='),html.indexOf('let mapFocusVersion=0;'));
const entries=[{state:{article:1},url:'/notice'},{state:{keep:true},url:'/?keep=1'}];let index=1,listener,selected=null,homes=0,pushes=0;
const context={URL,location:{href:'https://example.test/?keep=1'},stations:[{id:1},{id:2}],window:{addEventListener(type,fn){if(type==='popstate')listener=fn;}},history:{get state(){return entries[index].state;},replaceState(state,unused,url){entries[index]={state,url};context.location.href='https://example.test'+url;},pushState(state,unused,url){entries.splice(index+1);entries.push({state,url});index++;pushes++;context.location.href='https://example.test'+url;},back(){move(-1);}},choose(station){selected=station;context.rememberStationHistory(station);},returnToHome(options){homes++;selected=null;context.finishStationHomeHistory('/?keep=1',options.fromHistory);}};
function move(delta){if(index+delta<0||index+delta>=entries.length)return;index+=delta;context.location.href='https://example.test'+entries[index].url;listener({state:entries[index].state});}
vm.createContext(context);vm.runInContext(code,context);
context.choose(context.stations[0]);assert.equal(entries.length,3);assert.equal(entries[1].state.keep,true);assert.equal(entries[1].state.gasMap.view,'home');
context.choose(context.stations[1]);assert.equal(pushes,1);assert.equal(entries.length,3);
move(-1);assert.equal(selected,null);assert.equal(homes,1);assert.equal(index,1);assert.equal(context.location.href,'https://example.test/?keep=1');
move(1);assert.equal(selected.id,2);assert.equal(pushes,1);
selected=null;context.finishStationHomeHistory('/?keep=1',false);assert.equal(index,1);assert.equal(homes,1);assert.equal(pushes,1);
move(-1);assert.equal(index,0);assert.equal(homes,1);assert.equal(entries[index].url,'/notice');
move(1);assert.equal(homes,1);assert.equal(selected,null);
context.choose(context.stations[0]);assert.equal(pushes,2);assert.equal(entries.length,3);move(-1);assert.equal(selected,null);assert.equal(homes,2);move(-1);assert.equal(index,0);
console.log('PASS station back/home/forward, one detail entry across selections, normal article navigation and no history trap.');
