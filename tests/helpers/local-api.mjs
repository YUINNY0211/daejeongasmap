// Isolated SQLite fixture for API validation; never connects to production.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import crypto from 'node:crypto';
export const origin='http://127.0.0.1:8802';
export function createDatabase(){
 const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 sql.prepare('INSERT INTO citizen_stations(id,display_name,address,lat,lng) VALUES(222,?,?,?,?)').run('검증용 주유소','검증용 주소',36,127);
 const prepare=(query,args=[])=>({query,args,bind(...v){return prepare(query,v)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}}}});
 return {sql,DB:{prepare,async batch(queries){sql.exec('BEGIN IMMEDIATE');try{const result=queries.map(s=>{const r=sql.prepare(s.query).run(...s.args);return {meta:{changes:Number(r.changes)}}});sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}},close:()=>sql.close()};
}
export const localSecrets=()=>({hmac:crypto.randomBytes(32).toString('hex')});
export const localEnv=(DB,secrets)=>({DB,PUBLIC_ORIGIN:origin,LOCAL_TEST_MODE:'true',CITIZEN_WRITES_ENABLED:'true',TURNSTILE_HOSTNAME:'127.0.0.1',TURNSTILE_SITE_KEY:'test-only',TURNSTILE_SECRET:'test-only',ABUSE_HMAC_SECRET:secrets.hmac});
export const localFetcher=()=>async(url,options)=>{if(url!=='https://challenges.cloudflare.com/turnstile/v0/siteverify')throw Error('External network prohibited in tests');const b=JSON.parse(options.body);return Response.json({success:b.response==='local-preview-token',hostname:'127.0.0.1',action:b.__testAction});};
