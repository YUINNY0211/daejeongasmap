import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDatabase,localEnv,localSecrets,localFetcher,origin} from './helpers/local-api.mjs';
import {handle} from '../functions/_lib/citizen.js';

function setup(){
 const db=createDatabase(':memory:');
 const secrets=localSecrets(false);
 const env=localEnv(db.DB,secrets);
 const verify=localFetcher(secrets);
 const clock={now:Date.now()};
 async function call(route,body){
  return handle({
   env,
   request:new Request(origin+'/api/citizen/'+route,{
    method:'POST',
    headers:{Origin:origin,'Content-Type':'application/json'},
    body:JSON.stringify(body)
   })
  },{
   now:clock.now,
   fetch:async(u,o)=>{
    if(u.includes('/siteverify'))o={...o,body:JSON.stringify({...JSON.parse(o.body),__testAction:route})};
    return verify(u,o);
   }
  });
 }
 async function send(kind,data){
  const proof=await call('request',{kind,data});
  assert.equal(proof.status,200);
  return call(kind,{...data,...await proof.json(),turnstileToken:'local-preview-token'});
 }
 return {db,clock,send,call,env};
}

const report=(clientId,manageToken)=>({
 stationId:222,status:'received',clientId,manageToken
});

test('abuse: same identifier duplicate within one hour is rejected',async()=>{
 const h=setup();
 try{
  assert.equal((await h.send('reports',report('a'.repeat(64),'b'.repeat(64)))).status,201);
  h.clock.now+=3599999;
  const r=await h.send('reports',report('a'.repeat(64),'c'.repeat(64)));
  assert.equal(r.status,409);
  assert.equal((await r.json()).error,'duplicate_experience');
 }finally{h.db.close();}
});

test('abuse: same identifier permits new report at exact one-hour boundary',async()=>{
 const h=setup();
 try{
  assert.equal((await h.send('reports',report('a'.repeat(64),'b'.repeat(64)))).status,201);
  h.clock.now+=3600000;
  assert.equal((await h.send('reports',report('a'.repeat(64),'c'.repeat(64)))).status,201);
 }finally{h.db.close();}
});

test('abuse: fourth submission within one minute is rejected',async()=>{
 const h=setup();
 try{
  const data={
   stationId:222,category:'other',item:'other',
   message:'Synthetic test',clientId:'a'.repeat(64)
  };
  for(let i=0;i<3;i++){
   assert.equal((await h.send('suggestions',data)).status,201);
  }
  const r=await h.send('suggestions',data);
  assert.equal(r.status,429);
  assert.equal((await r.json()).error,'rate_limited');
  h.clock.now+=60000;
  assert.equal((await h.send('suggestions',data)).status,201);
 }finally{h.db.close();}
});

test('abuse limitation: changed identifier is treated as another browser',async()=>{
 const h=setup();
 try{
  assert.equal((await h.send('reports',report('a'.repeat(64),'b'.repeat(64)))).status,201);
  h.clock.now+=1000;
  assert.equal((await h.send('reports',report('c'.repeat(64),'d'.repeat(64)))).status,201);
  assert.equal(h.db.sql.prepare('SELECT COUNT(*) n FROM citizen_reports').get().n,2);
 }finally{h.db.close();}
});

test('abuse: disabled writes refuse new request proofs but preserve ownership status',async()=>{
 const h=setup();
 try{
  const data=report('a'.repeat(64),'b'.repeat(64));
  const registered=await h.send('reports',data);
  assert.equal(registered.status,201);
  const result=await registered.json();

  h.env.CITIZEN_WRITES_ENABLED='false';

  for(const kind of ['reports','suggestions','manage']){
   const r=await h.call('request',{kind,data});
   assert.equal(r.status,503);
   assert.deepEqual(await r.json(),{error:'not_enabled'});
  }

  const status=await h.call('management-status',{
   reportId:result.reportId,
   manageToken:data.manageToken
  });
  assert.equal(status.status,200);
  assert.equal((await status.json()).reportId,result.reportId);

  assert.equal(h.db.sql.prepare('SELECT COUNT(*) n FROM citizen_reports').get().n,1);

  h.env.CITIZEN_WRITES_ENABLED='true';
  const enabled=await h.call('request',{kind:'reports',data});
  assert.equal(enabled.status,200);
  assert.ok((await enabled.json()).proof.signature);
 }finally{h.db.close();}
});
