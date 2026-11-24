import assert from 'node:assert/strict';
import {createDatabase,localEnv,localSecrets,localFetcher,origin} from './helpers/local-api.mjs';
import {handle} from '../functions/_lib/citizen.js';
const db=createDatabase(':memory:'),secrets=localSecrets(false),env=localEnv(db.DB,secrets),verify=localFetcher(secrets);let now=Date.now();
async function call(route,data){return handle({env,request:new Request(origin+'/api/citizen/'+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)})},{now,fetch:async(u,o)=>verify(u,{...o,body:JSON.stringify({...JSON.parse(o.body),__testAction:route})})});}
async function send(message){now+=61000;const data={stationId:null,category:'other',item:'other',message,clientId:'a'.repeat(64)};const proof=await call('request',{kind:'suggestions',data});assert.equal(proof.status,200);return call('suggestions',{...data,...await proof.json(),turnstileToken:'local-preview-token'});}
try{
 for(const message of ['가','수정','확인요','긴 의견입니다. '.repeat(180)]){const result=await send(message);assert.equal(result.status,201,await result.text());assert.equal(db.sql.prepare('SELECT body FROM citizen_suggestions ORDER BY id DESC LIMIT 1').get().body,message.trim());}
 for(const message of ['','   \n\t']){const result=await send(message);assert.equal(result.status,400);assert.equal((await result.json()).error,'invalid_text');}
 assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM citizen_suggestions').get().n,4);
 console.log('PASS actual local API + isolated SQLite: 1/2/3 characters and text longer than 100 characters stored; blank/whitespace rejected. Production untouched.');
}finally{db.close();}
