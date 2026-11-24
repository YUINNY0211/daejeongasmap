import assert from 'node:assert/strict';
import {createDatabase,localEnv,localSecrets,localFetcher,origin} from './helpers/local-api.mjs';
import {handle} from '../functions/_lib/citizen.js';
const db=createDatabase(),secrets=localSecrets(),env=localEnv(db.DB,secrets),verify=localFetcher();let now=Date.now();
async function call(route,data){return handle({env,request:new Request(origin+'/api/citizen/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)})},{now,fetch:async(u,o)=>verify(u,{...o,body:JSON.stringify({...JSON.parse(o.body),__testAction:route})})});}
async function send(data){now+=61000;data={clientId:'a'.repeat(64),...data};const proof=await call('request',{kind:'suggestions',data});assert.equal(proof.status,200);return call('suggestions',{...data,...await proof.json(),turnstileToken:'local-preview-token'});}
db.sql.prepare('INSERT INTO citizen_suggestions(station_id,category,item,body,created) VALUES(NULL,?,?,?,?)').run('other','other','기존에 저장된 과거 의견',now-10000);
try{
 for(const data of [
  {stationId:222,category:'cashback',item:'cashback_received',message:''},
  {stationId:222,category:'location',item:'address',message:''},
  {stationId:null,category:'other',item:'closed_moved'},
  {stationId:null,category:'other',item:'other',message:'과거 클라이언트의 상세 내용'}
 ]){const result=await send(data);assert.equal(result.status,201,await result.text());assert.equal(db.sql.prepare('SELECT body FROM citizen_suggestions ORDER BY id DESC LIMIT 1').get().body,data.message||'');}
 assert.equal(db.sql.prepare('SELECT body FROM citizen_suggestions WHERE id=1').get().body,'기존에 저장된 과거 의견');
 assert.equal((await send({stationId:null,category:'cashback',item:'cashback_received',message:''})).status,400);
 assert.equal((await send({stationId:222,category:'other',item:'invalid',message:''})).status,400);
 assert.equal((await send({stationId:null,category:'other',item:'other',message:7})).status,400);
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM citizen_suggestions').get().n,5);
 console.log('PASS actual API + SQLite: category-only cashback/location/other accepted; old content preserved; invalid station/category/type rejected.');
}finally{db.close();}
