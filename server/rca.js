import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import {DATA_DIR} from './config.js'
import {databaseEnabled,getPool} from './db.js'
import {siteData,normalizeSite} from './pm-site.js'

const DEFAULT_SHEET_ID='1njg6uC06jo4A_pAnk_z8W_Ipro5jcFpCjrHIGxgy7Eg'
const LOCAL_FILE=path.join(DATA_DIR,'rca-snapshots.json')
const scope='https://www.googleapis.com/auth/spreadsheets.readonly'
const asText=value=>String(value??'').trim()
const slug=value=>asText(value).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')
const json=value=>JSON.stringify(value)
const base64url=value=>Buffer.from(value).toString('base64url')
const compact=value=>asText(value).replace(/\s+/g,' ')

const fieldAliases={
  site_id:['site_id','siteid','site'],site_name:['site_name','sitename','site_name_'],nop:['nop'],
  tech:['tech_conc','tech','technology','verifikasi'],down_date:['down_date','event_time','downdate'],
  duration_minutes:['durasi_alarm_menit','duration_minutes','duration'],duration_text:['duration_down','durasi','cat_down','aging_group'],
  alarm_2g:['alarm_name_2g','alarm_2g'],alarm_4g:['alarm_name_4g','alarm_4g'],alarm_5g:['alarm_name_5g','alarm_5g'],
  info_alarm:['info_alarm','info'],root_cause:['root_cause','rootcause'],validation:['validasi_down','validation']
}

async function config(){
  return {sheetId:asText(process.env.RCA_GOOGLE_SHEET_ID)||DEFAULT_SHEET_ID,credential:await serviceCredential()}
}

async function serviceCredential(){
  const raw=asText(process.env.GOOGLE_SERVICE_ACCOUNT_JSON||process.env.RCA_GOOGLE_SERVICE_ACCOUNT_JSON)
  if(raw){
    try{return JSON.parse(raw)}catch{throw Object.assign(new Error('GOOGLE_SERVICE_ACCOUNT_JSON bukan JSON yang valid.'),{status:503})}
  }
  const encoded=asText(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64||process.env.RCA_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64)
  if(encoded){
    try{return JSON.parse(Buffer.from(encoded,'base64').toString('utf8'))}catch{throw Object.assign(new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 bukan JSON Base64 yang valid.'),{status:503})}
  }
  const credentialPath=asText(process.env.GOOGLE_APPLICATION_CREDENTIALS||process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH||process.env.RCA_GOOGLE_SERVICE_ACCOUNT_JSON_PATH)
  if(credentialPath){
    try{return JSON.parse(await fs.readFile(credentialPath,'utf8'))}catch{throw Object.assign(new Error('File JSON Service Account tidak dapat dibaca atau formatnya tidak valid.'),{status:503})}
  }
  const client_email=asText(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||process.env.RCA_GOOGLE_SERVICE_ACCOUNT_EMAIL)
  const private_key=asText(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY||process.env.RCA_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).replace(/\\n/g,'\n')
  return client_email&&private_key?{client_email,private_key}:null
}

async function accessToken(credential){
  if(!credential?.client_email||!credential?.private_key)throw Object.assign(new Error('Kredensial Service Account belum tersedia. Isi GOOGLE_SERVICE_ACCOUNT_JSON atau GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'),{status:503})
  const now=Math.floor(Date.now()/1000),header=base64url(JSON.stringify({alg:'RS256',typ:'JWT'})),claim=base64url(JSON.stringify({iss:credential.client_email,scope,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3500}))
  const signer=crypto.createSign('RSA-SHA256');signer.update(`${header}.${claim}`);signer.end()
  const assertion=`${header}.${claim}.${signer.sign(credential.private_key).toString('base64url')}`
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(20000)})
  const body=await response.json().catch(()=>({}))
  if(!response.ok||!body.access_token)throw Object.assign(new Error(`Autentikasi Google gagal: ${body.error_description||body.error||response.statusText}`),{status:502})
  return body.access_token
}

async function googleJson(url,token){
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)})
  const body=await response.json().catch(()=>({}))
  if(!response.ok)throw Object.assign(new Error(`Google Sheets API gagal: ${body.error?.message||response.statusText}`),{status:502})
  return body
}

const findField=(headers,names)=>names.map(name=>headers.get(name)).find(index=>index!==undefined)
const number=value=>{const parsed=Number(String(value??'').replace(/,/g,''));return Number.isFinite(parsed)?parsed:null}
function parseRows(values,sheetName){
  const header=(values?.[0]||[]).map(slug),columns=new Map(header.map((name,index)=>[name,index]))
  const get=(row,key)=>{const index=findField(columns,fieldAliases[key]||[]);return index===undefined?'':asText(row[index])}
  const rows=[]
  for(const source of (values||[]).slice(1)){
    const site_id=get(source,'site_id');if(!site_id)continue
    rows.push({site_id,site_name:get(source,'site_name'),nop:get(source,'nop'),tech:get(source,'tech'),down_date:get(source,'down_date'),duration_minutes:number(get(source,'duration_minutes')),duration_text:get(source,'duration_text'),alarm_2g:get(source,'alarm_2g'),alarm_4g:get(source,'alarm_4g'),alarm_5g:get(source,'alarm_5g'),info_alarm:get(source,'info_alarm'),root_cause:get(source,'root_cause'),validation:get(source,'validation'),sheet_name:sheetName})
  }
  return rows
}

function dateFromSheetName(name){
  const hit=asText(name).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
  return hit?`${hit[3]}-${hit[2].padStart(2,'0')}-${hit[1].padStart(2,'0')} ${hit[4].padStart(2,'0')}:${hit[5]}:00`:null
}
function bucket(row){
  const minutes=Number(row.duration_minutes)
  if(Number.isFinite(minutes)){if(minutes>=1440)return '>1day';if(minutes>=720)return '12-24hrs';if(minutes>=480)return '8-12hrs';if(minutes>=240)return '4-8hrs';return '0-4hrs'}
  const text=asText(row.duration_text).toLowerCase()
  if(/>\s*1\s*(hari|day)|>\s*24/.test(text))return '>1day'
  if(/12\s*[-–]\s*24/.test(text))return '12-24hrs'
  if(/8\s*[-–]\s*12/.test(text))return '8-12hrs'
  if(/4\s*[-–]\s*8/.test(text))return '4-8hrs'
  return '0-4hrs'
}
function durationOrder(label){return ['>1day','12-24hrs','8-12hrs','4-8hrs','0-4hrs'].indexOf(label)}
function alarmText(row){
  const alarms=[row.alarm_2g,row.alarm_4g,row.alarm_5g].map(compact).filter(Boolean)
  const details=[...alarms,row.root_cause].filter(Boolean).join(' · ')
  return details||compact(row.info_alarm)||'-'
}
function templateDate(value){
  const text=asText(value).replace('T',' ').replace(/\.\d+Z?$/,'').replace(/Z$/,'')
  return text||'-'
}
function siteLine(row,index){
  const name=[row.site_id,asText(row.site_name).replace(/\s+/g,'')].filter(Boolean).join('_')
  return `↳ ${index+1}. ${name||'-'} | ${row.tech||'-'} | ${row.class_site||'-'} | ${templateDate(row.down_date)} *${alarmText(row)}*`
}

async function addMaster(rows){
  let master=[]
  try{master=(await siteData({includePm:false})).master||[]}catch{}
  const bySite=new Map(master.map(row=>[normalizeSite(row.site_id),row]))
  return rows.map(row=>{const item=bySite.get(normalizeSite(row.site_id));return {...row,class_site:item?.class_site||'',regional:item?.regional||''}})
}

async function localSnapshots(){
  try{return JSON.parse(await fs.readFile(LOCAL_FILE,'utf8'))}catch(error){if(error.code==='ENOENT')return [];throw error}
}
async function saveLocalSnapshots(items){await fs.mkdir(path.dirname(LOCAL_FILE),{recursive:true});await fs.writeFile(LOCAL_FILE,JSON.stringify(items,null,2),'utf8')}

export async function saveRcaSnapshots(snapshots){
  if(!databaseEnabled){
    const existing=await localSnapshots(),byName=new Map(existing.map(item=>[item.sheet_name,item]));for(const item of snapshots)byName.set(item.sheet_name,item)
    await saveLocalSnapshots([...byName.values()]);return snapshots
  }
  for(const item of snapshots)await getPool().query('INSERT INTO rca_snapshots(sheet_name,source_updated_at,synced_at,row_count,dataset) VALUES(?,?,NOW(),?,?) ON DUPLICATE KEY UPDATE source_updated_at=VALUES(source_updated_at),synced_at=NOW(),row_count=VALUES(row_count),dataset=VALUES(dataset)',[item.sheet_name,item.source_updated_at,item.row_count,json(item.rows)])
  return snapshots
}
export async function rcaSnapshots(){
  const rows=databaseEnabled?(await getPool().query('SELECT sheet_name,source_updated_at,synced_at,row_count FROM rca_snapshots ORDER BY COALESCE(source_updated_at,synced_at) DESC'))[0]:await localSnapshots()
  return rows.map(row=>({sheet_name:row.sheet_name,source_updated_at:row.source_updated_at||null,synced_at:row.synced_at?.toISOString?.()||row.synced_at||null,row_count:Number(row.row_count||row.rows?.length||0)}))
}
async function snapshotByName(name=''){
  if(databaseEnabled){const [rows]=await getPool().query(`SELECT sheet_name,source_updated_at,synced_at,row_count,dataset FROM rca_snapshots ${name?'WHERE sheet_name=?':''} ORDER BY COALESCE(source_updated_at,synced_at) DESC LIMIT 1`,name?[name]:[]);const row=rows[0];if(!row)return null;return {...row,rows:typeof row.dataset==='string'?JSON.parse(row.dataset):row.dataset}}
  const snapshots=await localSnapshots(),selected=name?snapshots.find(item=>item.sheet_name===name):[...snapshots].sort((a,b)=>String(b.source_updated_at||b.synced_at).localeCompare(String(a.source_updated_at||a.synced_at)))[0]
  return selected?{...selected,rows:selected.rows||[]}:null
}

export async function syncRcaGoogle({sheetName='' }={}){
  const {sheetId,credential}=await config(),token=await accessToken(credential),base=`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`
  const metadata=await googleJson(base,token),sheets=(metadata.sheets||[]).map(item=>item.properties?.title).filter(name=>name&&(/^RCA\b/i.test(name)))
  const selected=sheetName?[sheetName]:sheets;if(!selected.length)throw Object.assign(new Error('Tidak ada sheet RCA yang dapat disinkronkan.'),{status:422})
  if(sheetName&&!sheets.includes(sheetName))throw Object.assign(new Error('Snapshot RCA yang dipilih tidak ditemukan di Google Sheets.'),{status:404})
  const params=new URLSearchParams();for(const name of selected)params.append('ranges',`'${name.replace(/'/g,"''")}'!A:Z`)
  const result=await googleJson(`${base}/values:batchGet?${params.toString()}`,token),syncedAt=new Date().toISOString()
  const snapshots=(result.valueRanges||[]).map((range,index)=>{const name=selected[index],rows=parseRows(range.values||[],name);return {sheet_name:name,source_updated_at:dateFromSheetName(name),synced_at:syncedAt,row_count:rows.length,rows}})
  await saveRcaSnapshots(snapshots)
  return {synced_at:syncedAt,sheets:snapshots.map(({rows,...item})=>item)}
}

export async function rcaDashboard(query={}){
  const snapshot=await snapshotByName(asText(query.sheet));if(!snapshot)throw Object.assign(new Error('Belum ada snapshot RCA. Jalankan Sinkronkan RCA terlebih dahulu.'),{status:404})
  const allRows=await addMaster(snapshot.rows||[]),nop=asText(query.nop),duration=asText(query.duration),rootCause=asText(query.root_cause),search=asText(query.search).toLowerCase()
  const rows=allRows.filter(row=>(!nop||row.nop===nop)&&(!duration||bucket(row)===duration)&&(!rootCause||row.root_cause===rootCause)&&(!search||[row.site_id,row.site_name,row.nop,row.root_cause,row.info_alarm].join(' ').toLowerCase().includes(search))).map(row=>({...row,duration_bucket:bucket(row)})).sort((a,b)=>durationOrder(a.duration_bucket)-durationOrder(b.duration_bucket)||String(a.down_date).localeCompare(String(b.down_date)))
  const countBy=(items,key)=>Object.entries(items.reduce((out,row)=>{const value=key(row)||'Tidak tersedia';out[value]=(out[value]||0)+1;return out},{})).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value)
  return {snapshot:{sheet_name:snapshot.sheet_name,source_updated_at:snapshot.source_updated_at,synced_at:snapshot.synced_at,row_count:Number(snapshot.row_count||allRows.length)},filters:{nop_options:[...new Set(allRows.map(row=>row.nop).filter(Boolean))].sort(),duration_options:['>1day','12-24hrs','8-12hrs','4-8hrs','0-4hrs'],root_cause_options:[...new Set(allRows.map(row=>row.root_cause).filter(Boolean))].sort()},summary:{total:rows.length,over_day:rows.filter(row=>row.duration_bucket==='>1day').length,nop_affected:new Set(rows.map(row=>row.nop).filter(Boolean)).size},by_root_cause:countBy(rows,row=>row.root_cause),by_nop:countBy(rows,row=>row.nop),by_duration:countBy(rows,row=>row.duration_bucket),rows}
}

export async function rcaTemplate(query={}){
  const dashboard=await rcaDashboard(query),snapshot=dashboard.snapshot,rows=dashboard.rows
  if(!rows.length)throw Object.assign(new Error('Tidak ada alarm RCA sesuai filter aktif.'),{status:422})
  const nop=asText(query.nop)||'SEMUA NOP',lastUpdate=templateDate(snapshot.source_updated_at||snapshot.synced_at)
  const groups=['>1day','12-24hrs','8-12hrs','4-8hrs','0-4hrs'].map(label=>[label,rows.filter(row=>row.duration_bucket===label)]).filter(([,items])=>items.length)
  const body=groups.map(([label,items])=>`Duration: ${label}\n${items.map(siteLine).join('\n')}`).join('\n\n')
  return {template:`🚨 Alarm Down ${nop}\n(Last Update: ${lastUpdate})\n\nSite | Tech | Class | Event Time\n\n${body}`,row_count:rows.length,snapshot}
}
