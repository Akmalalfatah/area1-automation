import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash,randomUUID} from 'node:crypto'
import {gunzipSync,gzipSync} from 'node:zlib'
import {Readable} from 'node:stream'
import ExcelJS from 'exceljs'
import {DATA_DIR,SERVER_DIR} from './config.js'
import {databaseEnabled,getPool} from './db.js'

export const PRODUCTIVITY_REGIONS=['R01_Sumbagut','R02_Sumbagsel','R10_Sumbagteng']
const text=v=>String(v??'').trim()
const scalar=v=>v&&typeof v==='object'?('result' in v?v.result:'text' in v?v.text:'richText' in v?v.richText.map(x=>x.text).join(''):v):v
const key=v=>text(scalar(v)).toUpperCase().replace(/[^A-Z0-9]/g,'')
const present=v=>v!==undefined&&v!==null&&v!==''
const number=v=>present(v)&&Number.isFinite(Number(v))?Number(v):null
const fail=(message,status=422)=>Object.assign(new Error(message),{status})
export function productivityDate(value){
  value=scalar(value)
  if(!present(value))return null
  if(typeof value==='number')value=new Date(Date.UTC(1899,11,30)+value*86400000)
  if(value instanceof Date)return Number.isFinite(+value)?value.toISOString().slice(0,19):null
  let v=text(value).replace(/^'/,'').replace(/^(\d{2})[-/.](\d{2})[-/.](\d{4})/,'$3-$2-$1').replace(' ','T')
  if(!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(v))return null
  const date=new Date(v.length===10?v+'T00:00:00Z':v+'Z')
  return Number.isFinite(+date)&&date.toISOString().slice(0,10)===v.slice(0,10)?v:null
}
export const productivityPicId=(regional,pic)=>createHash('sha256').update(regional+'\0'+pic).digest('hex').slice(0,24)
export function productivityNameRole(pic){const token=text(pic).toUpperCase().match(/(?:^|[^A-Z0-9])(BPS\d*|MBP|TS)(?=$|[^A-Z0-9])/);return token?(token[1]==='TS'?'TS':'MBP'):null}
export function productivityTicketRole(ticket){const token=text(ticket).toUpperCase().match(/^(BPS|TS)(?=[^A-Z]|$)/);return token?(token[1]==='TS'?'TS':'MBP'):'unmapped'}
const automaticRowRole=row=>productivityNameRole(row.pic)||productivityTicketRole(row.ticket_no)
export function productivityRow(raw,sourceRow){
  const pic=String(raw.PICTAKEOVERTICKET??''),regional=text(raw.REGIONAL),ticket=text(raw.TICKETNUMBERSWFM)
  if(!ticket||!pic.trim()||!PRODUCTIVITY_REGIONS.includes(regional))return null
  const start=number(raw.RHSTART),stop=number(raw.RHSTOP),rh=number(raw.RH)??(start!==null&&stop!==null?stop-start:null)
  return {source_row:sourceRow,pic_id:productivityPicId(regional,pic),pic:pic.trim(),pic_source:pic,regional,nop:text(raw.NOP).replace(/^NOP\s+/i,''),ticket_no:ticket,site_id:text(raw.SITEID),site_name:text(raw.SITENAME),status:text(raw.TICKETSWFMSTATUS),take_over_at:productivityDate(raw.TAKEOVERDATE),check_in_at:productivityDate(raw.CHECKINAT),rh_start:start,rh_stop:stop,rh_start_raw:present(raw.RHSTART)?String(raw.RHSTART):'',rh_stop_raw:present(raw.RHSTOP)?String(raw.RHSTOP):'',backup_recorded:present(raw.RHSTART),check_in_recorded:present(raw.CHECKINAT),rh_start_at:productivityDate(raw.RHSTARTTIME),rh_stop_at:productivityDate(raw.RHSTOPTIME),rh,anomaly:rh!==null&&(Math.abs(rh)>=1000||rh<0)}
}
export function buildProductivityDataset(rows,meta={}){
  const dates=[...new Set(rows.flatMap(r=>[r.take_over_at,r.check_in_at,r.rh_start_at].filter(Boolean).map(x=>x.slice(0,10))))].sort()
  const roster=new Map()
  for(const row of rows){let pic=roster.get(row.pic_id);if(!pic){pic={id:row.pic_id,pic:row.pic,pic_source:row.pic_source,regional:row.regional,nops:[],auto_roles:[]};roster.set(row.pic_id,pic)}if(row.nop&&!pic.nops.includes(row.nop))pic.nops.push(row.nop);const role=automaticRowRole(row);if(!pic.auto_roles.includes(role))pic.auto_roles.push(role)}
  return {version:1,...meta,rows,roster:[...roster.values()],dates,date_start:dates[0]||null,date_end:dates.at(-1)||null,row_count:rows.length}
}
// Streaming importer for the initial workbook. Runtime SWFM uploads reuse the
// existing workbook parse, so they never load/parse the same workbook twice.
export async function parseProductivityWorkbook(input,filename='Ticket SWFM.xlsx'){
  const reader=new ExcelJS.stream.xlsx.WorkbookReader(Buffer.isBuffer(input)?Readable.from(input):input,{entries:'emit',sharedStrings:'cache',styles:'cache',worksheets:'emit',hyperlinks:'ignore'})
  const rows=[];let found=false,sourceRows=0,missingPic=0
  for await(const sheet of reader){let columns=null
    for await(const row of sheet){
      if(!columns){if(row.number>25)break;const mapped={};row.eachCell((cell,i)=>{mapped[key(cell.value)]=i});if(['TICKETNUMBERSWFM','PICTAKEOVERTICKET','CHECKINAT','RHSTART','REGIONAL'].every(k=>mapped[k])){columns=mapped;found=true}continue}
      const raw={};for(const [k,i] of Object.entries(columns))raw[k]=scalar(row.getCell(i).value)
      if(!text(raw.TICKETNUMBERSWFM))continue
      sourceRows++;if(!text(raw.PICTAKEOVERTICKET))missingPic++
      const record=productivityRow(raw,row.number);if(record)rows.push(record)
    }
    if(found)break
  }
  if(!found||!rows.length)throw fail('Kolom Productivity SWFM tidak ditemukan atau tidak ada ticket dengan PIC.')
  return buildProductivityDataset(rows,{filename,source_rows:sourceRows,missing_pic:missingPic})
}

let bundledPromise,localQueue=Promise.resolve(),revision=0
const cache=new Map()
const dir=()=>path.join(DATA_DIR,'productivity')
async function bundled(){return bundledPromise??=fs.readFile(path.join(SERVER_DIR,'data','productivity-swfm-default.json.gz')).then(b=>{const data=JSON.parse(gunzipSync(b));return{...data,roster:buildProductivityDataset(data.rows).roster}}).catch(e=>{if(e.code==='ENOENT')return buildProductivityDataset([]);throw e})}
function periodsFor(dataset){return [...new Set(dataset.dates.map(x=>x.slice(0,7)))].sort()}
export async function saveProductivitySnapshot(dataset,filename,uploadDate,connection=null){
  if(!dataset?.rows?.length)return null
  const periods=periodsFor(dataset),stamp=new Date().toISOString()
  const store=async conn=>{
    for(const period of periods){
      const rows=dataset.rows.filter(r=>[r.take_over_at,r.check_in_at,r.rh_start_at].some(x=>x?.startsWith(period)))
      const meta={...dataset,rows:undefined,roster:undefined,filename,upload_date:uploadDate,updated_at:stamp,dates:dataset.dates.filter(d=>d.startsWith(period)),period,row_count:rows.length}
      if(conn){
        await conn.query('INSERT INTO productivity_swfm_snapshots(period,metadata) VALUES(?,?) ON DUPLICATE KEY UPDATE metadata=VALUES(metadata),updated_at=CURRENT_TIMESTAMP(3)',[period,JSON.stringify(meta)])
        await conn.query('DELETE FROM productivity_swfm_rows WHERE period=?',[period])
        for(let i=0;i<rows.length;i+=100)await conn.query('INSERT INTO productivity_swfm_rows(period,row_no,payload) VALUES ?',[rows.slice(i,i+100).map(r=>[period,r.source_row,JSON.stringify(r)])])
      }else{await fs.mkdir(dir(),{recursive:true});const target=path.join(dir(),period+'.json.gz'),tmp=target+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,gzipSync(JSON.stringify({...meta,rows,roster:dataset.roster})));await fs.rename(tmp,target);await atomicJson(path.join(dir(),period+'.meta.json'),meta)}
    }
    if(conn){for(const p of dataset.roster)await conn.query('INSERT INTO productivity_pic_roster(pic_id,profile,settings) VALUES(?,?,?) ON DUPLICATE KEY UPDATE profile=VALUES(profile)',[p.id,JSON.stringify(p),'{}'])}
    else {const previous=await readJson(path.join(dir(),'roster.json'),{});for(const p of dataset.roster)previous[p.id]=p;await atomicJson(path.join(dir(),'roster.json'),previous)}
  }
  if(connection)await store(connection)
  else if(databaseEnabled){const conn=await getPool().getConnection();try{await conn.beginTransaction();await store(conn);await conn.commit()}catch(e){await conn.rollback();throw e}finally{conn.release()}}
  else {const job=localQueue.catch(()=>{}).then(()=>store(null));localQueue=job;await job}
  revision++;cache.clear();return {periods,row_count:dataset.rows.length}
}
const parse=v=>typeof v==='string'?JSON.parse(v):v
async function readJson(file,fallback){try{return JSON.parse(await fs.readFile(file,'utf8'))}catch(e){if(e.code==='ENOENT')return fallback;throw fail('Data pengaturan Productivity tidak valid. Data tidak ditimpa.',500)}}
async function atomicJson(file,value){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify(value));await fs.rename(tmp,file)}
async function metadata(){
  if(databaseEnabled){const [records]=await getPool().query('SELECT period,metadata FROM productivity_swfm_snapshots ORDER BY period DESC');return records.map(r=>parse(r.metadata))}
  const names=await fs.readdir(dir()).catch(e=>{if(e.code==='ENOENT')return [];throw e})
  const records=await Promise.all(names.filter(n=>/^\d{4}-\d{2}\.meta\.json$/.test(n)).map(name=>readJson(path.join(dir(),name),null)))
  return records.sort((a,b)=>b.period.localeCompare(a.period))
}
async function context(query={}){
  for(const key of ['date','role','nop','search','page','regional','pic_id','anomalies'])if(query[key]!==undefined&&typeof query[key]!=='string')throw fail('Filter Productivity tidak valid.')
  if(query.date&&!/^\d{4}-\d{2}-\d{2}$/.test(query.date))throw fail('Tanggal Daily tidak valid.')
  if(query.date&&productivityDate(query.date)===null)throw fail('Tanggal Daily tidak valid.')
  if(query.role&&!['all','MBP','TS','unmapped'].includes(query.role))throw fail('Jenis PIC tidak valid.')
  const allMeta=await metadata(),initial=await bundled(),latest=allMeta[0],date=query.date||latest?.date_end||initial.date_end||'',period=date.slice(0,7)
  const selected=allMeta.find(m=>m.period===period),token=period+'|'+(selected?.updated_at||'bundled')+'|'+revision
  let dataset=cache.get(token)
  if(!dataset){
    if(selected&&databaseEnabled){const [records]=await getPool().query('SELECT payload FROM productivity_swfm_rows WHERE period=? ORDER BY row_no',[period]);dataset={...selected,rows:records.map(r=>parse(r.payload)),source:'upload'}}
    else if(selected)dataset={...JSON.parse(gunzipSync(await fs.readFile(path.join(dir(),period+'.json.gz')))),source:'upload'}
    else dataset={...initial,rows:initial.rows.filter(r=>[r.take_over_at,r.check_in_at,r.rh_start_at].some(x=>x?.startsWith(period))),dates:initial.dates.filter(x=>x.startsWith(period)),source:'bundled'}
    cache.clear();cache.set(token,dataset)
  }
  let profiles={},settings={}
  if(databaseEnabled){const [records]=await getPool().query('SELECT pic_id,profile,settings FROM productivity_pic_roster');for(const r of records){profiles[r.pic_id]=parse(r.profile);settings[r.pic_id]=parse(r.settings)||{}}}
  else {profiles=await readJson(path.join(dir(),'roster.json'),{});settings=await readJson(path.join(dir(),'pic-settings.json'),{})}
  const roster=new Map(initial.roster.map(p=>[p.id,p]));for(const p of Object.values(profiles))roster.set(p.id,p)
  for(const r of dataset.rows){if(!roster.has(r.pic_id))roster.set(r.pic_id,{id:r.pic_id,pic:r.pic,pic_source:r.pic_source,regional:r.regional,nops:[r.nop]})}
  const rowsByPic=new Map();for(const row of dataset.rows){if(!rowsByPic.has(row.pic_id))rowsByPic.set(row.pic_id,[]);rowsByPic.get(row.pic_id).push(row)}
  const pics=[...roster.values()].map(p=>{const manual=settings[p.id]?.role,name=productivityNameRole(p.pic),rows=rowsByPic.get(p.id)||[];const roles=manual&&manual!=='auto'?[manual]:name?[name]:rows.length?[...new Set(rows.map(automaticRowRole))]:p.auto_roles?.length?p.auto_roles:initial.roster.find(x=>x.id===p.id)?.auto_roles||['unmapped'];return{...p,roles,role:roles.join(' / '),role_source:manual&&manual!=='auto'?'manual':name?'name':'ticket',active:settings[p.id]?.active!==false}})
  return {dataset,pics,rowsByPic,date,period,periods:[...new Set([...allMeta.map(x=>x.period),...periodsFor(initial)])].sort().reverse(),role:query.role||'all',nop:text(query.nop),search:text(query.search).toLowerCase()}
}
export function measureProductivity(rows,date){
  const m={take_over:0,check_in:0,backup:0,rh:0,anomalies:0}
  for(const r of rows){
    const take=!date||r.take_over_at?.slice(0,10)===date,visit=!date||r.check_in_at?.slice(0,10)===date,backup=!date||r.rh_start_at?.slice(0,10)===date
    if(take)m.take_over++
    if(visit&&r.check_in_recorded)m.check_in++
    if(backup&&r.backup_recorded)m.backup++
    if(backup&&r.rh!==null){m.rh+=r.rh;if(r.anomaly)m.anomalies++}
  }
  m.rh=Math.round(m.rh*100)/100;m.backup_percent=m.check_in?Math.round(m.backup/m.check_in*10000)/100:null
  return m
}
const filterPics=(c,region)=>c.pics.filter(p=>p.active&&(!region||p.regional===region)&&(c.role==='all'||p.roles.includes(c.role))&&(!c.nop||p.nops.includes(c.nop))&&(!c.search||[p.pic,p.regional,...p.nops].join(' ').toLowerCase().includes(c.search)))
const matchingRow=(c,p,r)=>(!c.nop||r.nop===c.nop)&&(c.role==='all'||(p.role_source==='manual'?p.roles.includes(c.role):automaticRowRole(r)===c.role))
function metricsFor(c,p){return measureProductivity((c.rowsByPic.get(p.id)||[]).filter(r=>matchingRow(c,p,r)),c.date)}
function responseMeta(c){const d=c.dataset;return{date:c.date,data_available:(d.dates||[]).includes(c.date),period:c.period,periods:c.periods,source:{filename:d.filename||null,upload_date:d.upload_date||null,date_start:d.date_start,date_end:d.date_end,kind:d.source},nops:[...new Set(c.pics.flatMap(p=>p.nops))].filter(Boolean).sort(),unmapped_pics:c.pics.filter(p=>p.active&&p.roles.includes('unmapped')).length,method:{daily:'Tanggal masing-masing aktivitas',backup_percent:'Backup / Check-in × 100%',rh:'Nilai RH Excel pada tanggal RH Start Time'},role:c.role}}
export async function productivitySummary(query={}){
  const c=await context(query),regions=PRODUCTIVITY_REGIONS.map(regional=>{
    const pics=filterPics(c,regional),byId=new Map(pics.map(p=>[p.id,p])),rows=c.dataset.rows.filter(r=>byId.has(r.pic_id)&&matchingRow(c,byId.get(r.pic_id),r)),m=measureProductivity(rows,c.date)
    return{regional,total_pics:pics.length,active_pics:pics.filter(p=>{const x=metricsFor(c,p);return x.take_over||x.check_in||x.backup}).length,...m}
  })
  // Ratio of summed numerators/denominators; never average regional percentages.
  const total=regions.reduce((a,r)=>{for(const k of ['total_pics','active_pics','take_over','check_in','backup','rh','anomalies'])a[k]=(a[k]||0)+r[k];return a},{})
  total.rh=Math.round(total.rh*100)/100;total.backup_percent=total.check_in?Math.round(total.backup/total.check_in*10000)/100:null
  return{...responseMeta(c),regions,total}
}
function pagination(query,count){const page=Number(query.page||1);if(!Number.isSafeInteger(page)||page<1)throw fail('Halaman tidak valid.');return{page:Math.min(page,Math.max(1,Math.ceil(count/50))),page_size:50,total:count,total_pages:Math.max(1,Math.ceil(count/50))}}
export async function productivityRegion(regional,query={}){
  if(!PRODUCTIVITY_REGIONS.includes(regional))throw fail('Regional tidak ditemukan.',404)
  const c=await context(query),all=filterPics(c,regional).map(p=>({...p,...metricsFor(c,p)})).sort((a,b)=>(b.take_over+b.check_in+b.backup)-(a.take_over+a.check_in+a.backup)||a.pic.localeCompare(b.pic,'id'))
  const paging=pagination(query,all.length),summary=(await productivitySummary({...query,date:c.date})).regions.find(r=>r.regional===regional)
  return{...responseMeta(c),regional,summary,pagination:paging,pics:all.slice((paging.page-1)*50,paging.page*50)}
}
export async function productivityTickets(query={}){
  const c=await context(query),pic=c.pics.find(p=>p.id===query.pic_id)
  if(!pic)throw fail('PIC tidak ditemukan.',404)
  const all=c.dataset.rows.filter(r=>r.pic_id===pic.id&&matchingRow(c,pic,r)&&[r.take_over_at,r.check_in_at,r.rh_start_at].some(x=>x?.slice(0,10)===c.date)).filter(r=>query.anomalies!=='1'||r.anomaly)
  const paging=pagination(query,all.length)
  return{...responseMeta(c),pic,pagination:paging,tickets:all.slice((paging.page-1)*50,paging.page*50).map(r=>({...r,activities:{take_over:r.take_over_at?.slice(0,10)===c.date,check_in:r.check_in_recorded&&r.check_in_at?.slice(0,10)===c.date,backup:r.backup_recorded&&r.rh_start_at?.slice(0,10)===c.date},anomaly_reason:r.anomaly?r.rh<0?'RH negatif':'RH minimal 1.000':''}))}
}
export async function productivityRoster(query={}){
  const c=await context(query),regional=text(query.regional)
  const all=c.pics.filter(p=>(!regional||p.regional===regional)&&(!c.nop||p.nops.includes(c.nop))&&(!c.search||p.pic.toLowerCase().includes(c.search))).sort((a,b)=>a.pic.localeCompare(b.pic,'id')),paging=pagination(query,all.length)
  return{...responseMeta(c),pagination:paging,pics:all.slice((paging.page-1)*50,paging.page*50)}
}
export async function saveProductivityPics(body={}){
  const ids=body.ids;if(!Array.isArray(ids)||!ids.length||ids.length>200||ids.some(id=>typeof id!=='string'))throw fail('Pilih 1 sampai 200 PIC.')
  if(body.role!==undefined&&!['auto','MBP','TS','unmapped'].includes(body.role))throw fail('Jenis PIC tidak valid.')
  if(body.active!==undefined&&typeof body.active!=='boolean')throw fail('Status PIC tidak valid.')
  if(body.role===undefined&&body.active===undefined)throw fail('Tidak ada perubahan PIC.')
  const c=await context(),byId=new Map(c.pics.map(p=>[p.id,p]));if(ids.some(id=>!byId.has(id)))throw fail('PIC tidak ditemukan.',404)
  const patch={...(body.role!==undefined?{role:body.role}:{}),...(body.active!==undefined?{active:body.active}:{})}
  if(databaseEnabled){const conn=await getPool().getConnection();try{await conn.beginTransaction();for(const id of ids){await conn.query('INSERT IGNORE INTO productivity_pic_roster(pic_id,profile,settings) VALUES(?,?,?)',[id,JSON.stringify(byId.get(id)),'{}']);const [records]=await conn.query('SELECT settings FROM productivity_pic_roster WHERE pic_id=? FOR UPDATE',[id]);await conn.query('UPDATE productivity_pic_roster SET settings=? WHERE pic_id=?',[JSON.stringify({...parse(records[0].settings),...patch}),id])}await conn.commit()}catch(e){await conn.rollback();throw e}finally{conn.release()}}
  else {const job=localQueue.catch(()=>{}).then(async()=>{const all=await readJson(path.join(dir(),'pic-settings.json'),{});for(const id of ids)all[id]={...all[id],...patch};await atomicJson(path.join(dir(),'pic-settings.json'),all)});localQueue=job;await job}
  return{updated:ids.length}
}
