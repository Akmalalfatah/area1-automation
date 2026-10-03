import {DATA_DIR,RUNS_DIR} from './config.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import mysql from 'mysql2/promise'

const enabled=!['0','false','no'].includes((process.env.USE_DATABASE||'true').toLowerCase())
const env=(...names)=>names.map(name=>process.env[name]).find(value=>value!==undefined&&value!=='')||''
const truthy=value=>['1','true','yes','on','required'].includes(String(value||'').toLowerCase())
const ssl=()=>{
  if(!truthy(env('DB_SSL','MYSQL_SSL')))return undefined
  const ca=env('DB_SSL_CA','MYSQL_SSL_CA').replace(/\\n/g,'\n')
  return ca?{ca,rejectUnauthorized:!['0','false','no'].includes(env('DB_SSL_REJECT_UNAUTHORIZED')||'true')}: {rejectUnauthorized:!['0','false','no'].includes(env('DB_SSL_REJECT_UNAUTHORIZED')||'true')}
}
const settings={host:env('DB_HOST','MYSQL_HOST'),port:Number(env('DB_PORT','MYSQL_PORT')||3306),user:env('DB_USER','MYSQL_USER'),password:env('DB_PASSWORD','MYSQL_PASSWORD'),database:env('DB_NAME','MYSQL_DATABASE'),connectTimeout:Number(env('DB_CONNECT_TIMEOUT')||20000),enableKeepAlive:true,keepAliveInitialDelay:0,ssl:ssl()}
export const databaseEnabled=enabled&&Boolean(settings.host&&settings.user&&settings.database)
let pool

export function getPool(){
  if(!databaseEnabled)throw new Error('DB_HOST, DB_USER, dan DB_NAME belum dikonfigurasi di Environment Variables.')
  if(!pool)pool=mysql.createPool({...settings,waitForConnections:true,connectionLimit:Number(env('DB_POOL_SIZE')||5),queueLimit:0,charset:'utf8mb4',dateStrings:true,timezone:'Z'})
  return pool
}

const iso=value=>value instanceof Date?value.toISOString().slice(0,10):String(value).slice(0,10)
const json=value=>JSON.stringify(value)

export async function initDb(serverDir){
  if(!databaseEnabled)return
  const sql=(await Promise.all(['schema.mysql.sql','pm-genset.mysql.sql'].map(file=>fs.readFile(path.join(serverDir,'sql',file),'utf8')))).join('\n')
  for(const statement of sql.split(/;\s*(?:\r?\n|$)/).map(x=>x.trim()).filter(Boolean))await getPool().query(statement)
  const [ordering]=await getPool().query("SHOW COLUMNS FROM application_upload_history LIKE 'history_order'")
  if(!ordering.length)await getPool().query('ALTER TABLE application_upload_history ADD COLUMN history_order BIGINT UNSIGNED NOT NULL AUTO_INCREMENT UNIQUE')
}

export async function saveHistory(runId,dataset,upload){
  if(!databaseEnabled){await recordApplicationUpload('ekpi',runId,upload.filename,upload.date,dataset.nops?.length||0);return []}
  const date=dataset.date,title=dataset.reporting_period?.type==='closing_previous_month'?`KPI ${dataset.reporting_period.label}`:`KPI ${new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`))}`
  const history={run_id:runId,title,date,file:dataset.file||'',upload,nop_count:dataset.nops?.length||0},connection=await getPool().getConnection()
  try{
    await connection.beginTransaction()
    const [sameDay]=await connection.query('SELECT run_id,history FROM kpi_history WHERE date_end=? AND run_id<>?',[date,runId]),ids=sameDay.filter(row=>{const previous=typeof row.history==='string'?JSON.parse(row.history):row.history;return (previous?.upload?.reporting_type||'current')===(upload.reporting_type||'current')}).map(row=>row.run_id)
    if(ids.length)await connection.query('DELETE FROM kpi_history WHERE run_id IN (?)',[ids])
    await connection.query(`INSERT INTO kpi_history (run_id,title,date_start,date_end,year,month,day,dataset,uploads,history)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),date_start=VALUES(date_start),date_end=VALUES(date_end),year=VALUES(year),month=VALUES(month),day=VALUES(day),dataset=VALUES(dataset),uploads=VALUES(uploads),history=VALUES(history),updated_at=CURRENT_TIMESTAMP`,[runId,title,date,date,Number(date.slice(0,4)),Number(date.slice(5,7)),Number(date.slice(8,10)),json(dataset),json(upload),json(history)])
    await recordApplicationUpload('ekpi',runId,upload.filename,upload.date,dataset.nops?.length||0,connection)
    await connection.commit();return ids
  }catch(error){await connection.rollback().catch(()=>{});throw error}finally{connection.release()}
}

export async function listHistory({day,month,year}={}){
  if(!databaseEnabled){
    const folders=await fs.readdir(RUNS_DIR,{withFileTypes:true}).catch(error=>{if(error.code==='ENOENT')return [];throw error})
    const items=await Promise.all(folders.filter(folder=>folder.isDirectory()).map(async folder=>{
      try{const state=JSON.parse(await fs.readFile(path.join(RUNS_DIR,folder.name,'state.json'),'utf8'));if(!state.processed||!state.upload)return null;const date=state.upload.date,stat=await fs.stat(path.join(RUNS_DIR,folder.name,'state.json'));return{run_id:state.id,title:`KPI ${date}`,date_start:date,date_end:date,year:Number(date.slice(0,4)),month:Number(date.slice(5,7)),day:Number(date.slice(8,10)),history:{upload:state.upload,nop_count:state.upload.nop_count},updated_at:stat.mtime.toISOString()}}catch(error){if(error.code==='ENOENT')return null;throw error}
    }))
    return items.filter(row=>row&&(!day||row.day===Number(day))&&(!month||row.month===Number(month))&&(!year||row.year===Number(year))).sort((a,b)=>b.date_end.localeCompare(a.date_end)||b.updated_at.localeCompare(a.updated_at))
  }
  const clauses=[],params=[];for(const [key,value] of Object.entries({year,month,day}))if(value){clauses.push(`${key}=?`);params.push(Number(value))}
  const [rows]=await getPool().query(`SELECT run_id,title,date_start,date_end,year,month,day,history,created_at,updated_at FROM kpi_history ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''} ORDER BY date_end DESC,created_at DESC LIMIT 100`,params)
  return rows.map(row=>({...row,date_start:iso(row.date_start),date_end:iso(row.date_end),history:typeof row.history==='string'?JSON.parse(row.history):row.history,created_at:row.created_at?.toISOString?.()||row.created_at,updated_at:row.updated_at?.toISOString?.()||row.updated_at}))
}

export async function loadHistoryDataset(runId){if(!databaseEnabled)return null;const [rows]=await getPool().query('SELECT dataset FROM kpi_history WHERE run_id=?',[runId]);const value=rows[0]?.dataset;return typeof value==='string'?JSON.parse(value):value||null}
export async function loadPreviousHistoryDataset(runId,currentDate){if(!databaseEnabled||!currentDate)return null;const [rows]=await getPool().query('SELECT dataset FROM kpi_history WHERE run_id<>? AND date_end<? ORDER BY date_end DESC,created_at DESC LIMIT 1',[runId,currentDate]);const value=rows[0]?.dataset;return typeof value==='string'?JSON.parse(value):value||null}
export async function deleteHistory(runIds){if(!databaseEnabled)throw new Error('Database history belum dikonfigurasi.');const [result]=await getPool().query('DELETE FROM kpi_history WHERE run_id IN (?)',[runIds]);return result.affectedRows}

let localUploadQueue=Promise.resolve()
export function assertPreventivePacketSize(bytes,limit){
  if(bytes>=limit)throw Object.assign(new Error(`Data upload membutuhkan paket MySQL ${(bytes/1048576).toFixed(2)} MB, sedangkan max_allowed_packet hanya ${(limit/1048576).toFixed(2)} MB. Atur max_allowed_packet=64M pada bagian [mysqld] di my.ini MySQL (XAMPP: mysql/bin/my.ini), lalu restart MySQL dan server aplikasi. Data sebelumnya tetap dipertahankan.`),{status:503,code:'PM_PACKET_TOO_LARGE'})
}
export function savePreventiveUpload(...args){
  if(databaseEnabled)return savePreventiveUploadImpl(...args)
  const operation=localUploadQueue.then(()=>savePreventiveUploadImpl(...args));localUploadQueue=operation.catch(()=>{});return operation
}
async function savePreventiveUploadImpl(uploadId,uploadDate,filename,dataset){
  if(!databaseEnabled){
    const file=path.join(DATA_DIR,'local-preventive-uploads.json')
    await fs.mkdir(path.dirname(file),{recursive:true})
    const records=await localPreventiveUploads(true)
    const kind=dataset.maintenance_kind
    const matches=record=>record.active!==false&&record.upload_date===uploadDate&&record.dataset?.maintenance_kind===kind&&(record.dataset?.upload_page||uploadKind(record))===(dataset.upload_page||kind)
    const replaced=records.filter(matches).length
    const kept=records.map(record=>matches(record)?{...record,active:false}:record)
    kept.push({upload_id:uploadId,upload_date:uploadDate,filename,dataset,updated_at:new Date().toISOString()})
    await fs.writeFile(file+'.tmp',JSON.stringify(kept),'utf8')
    await fs.rename(file+'.tmp',file)
    return replaced
  }
  const connection=await getPool().getConnection()
  try{
    const insertSql='INSERT INTO preventive_uploads(upload_id,upload_date,filename,dataset) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE upload_date=VALUES(upload_date),filename=VALUES(filename),dataset=VALUES(dataset),updated_at=CURRENT_TIMESTAMP';
    const insertValues=[uploadId,uploadDate,filename,json(dataset)];
    const [[limits]]=await connection.query('SELECT @@SESSION.max_allowed_packet AS packet');
    assertPreventivePacketSize(Buffer.byteLength(connection.format(insertSql,insertValues),'utf8')+1,Number(limits.packet));
    await connection.beginTransaction();const kind=dataset.maintenance_kind;const page=dataset.upload_page||kind;const predicate="upload_date=? AND upload_id<>? AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(dataset,'$.upload_page')),COALESCE(JSON_UNQUOTE(JSON_EXTRACT(dataset,'$.maintenance_kind')),CASE WHEN LOWER(filename) LIKE '%genset%' THEN 'genset' ELSE 'site' END))=? AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(dataset,'$.maintenance_kind')),CASE WHEN LOWER(filename) LIKE '%genset%' THEN 'genset' WHEN LOWER(filename) LIKE '%punchlist%' THEN 'punchlist' ELSE 'site' END)=?";const [[count]]=await connection.query(`SELECT COUNT(*) AS count FROM preventive_uploads WHERE ${predicate}`,[uploadDate,uploadId,page,kind]);await connection.query(`DELETE FROM preventive_uploads WHERE ${predicate}`,[uploadDate,uploadId,page,kind]);await connection.query(insertSql,insertValues);await connection.query('INSERT INTO application_upload_history(upload_id,page,filename,upload_date,row_count) VALUES(?,?,?,?,?)',[uploadId,page,filename,uploadDate,dataset.row_count||0]);await connection.commit();return Number(count.count)}catch(error){await connection.rollback().catch(()=>{});throw error}finally{connection.release()}
}

async function localPreventiveUploads(includeInactive=false){
  try{const records=JSON.parse(await fs.readFile(path.join(DATA_DIR,'local-preventive-uploads.json'),'utf8'));return includeInactive?records:records.filter(record=>record.active!==false)}catch(error){if(error.code==='ENOENT')return [];throw error}
}
const uploadKind=record=>record.dataset?.maintenance_kind||(String(record.filename).toLowerCase().includes('genset')?'genset':'site')
export async function preventiveUploadHistory(page='dashboard',activeOnly=false){
  if(!['dashboard','genset','site'].includes(page))throw Object.assign(new Error('Halaman upload tidak valid.'),{status:422})
  const records=databaseEnabled?(await getPool().query('SELECT upload_id,filename,dataset,upload_date,updated_at FROM preventive_uploads ORDER BY upload_date DESC,updated_at DESC'))[0]:await localPreventiveUploads(true)
  return records.map(record=>({...record,dataset:typeof record.dataset==='string'?JSON.parse(record.dataset):record.dataset})).filter(record=>(!activeOnly||record.active!==false)&&(record.dataset?.upload_page||uploadKind(record))===page).reverse().sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).map(record=>({upload_id:record.upload_id,filename:record.filename,upload_date:iso(record.upload_date),row_count:record.dataset?.row_count||0,date_start:record.dataset?.date_start,date_end:record.dataset?.date_end,updated_at:record.updated_at,page}))
}
export async function recordApplicationUpload(page,id,filename,date,count,connection){
  if(databaseEnabled){await (connection||getPool()).query('INSERT INTO application_upload_history(upload_id,page,filename,upload_date,row_count) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE filename=VALUES(filename),upload_date=VALUES(upload_date),row_count=VALUES(row_count)',[id,page,filename,date,count]);return}
  const file=path.join(DATA_DIR,'upload-history.json');await fs.mkdir(DATA_DIR,{recursive:true});let records=[];
  try{records=JSON.parse(await fs.readFile(file,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error}
  records=records.filter(row=>row.upload_id!==id);records.push({upload_id:id,page,filename,upload_date:date,row_count:count,updated_at:new Date().toISOString()});await fs.writeFile(file+'.tmp',JSON.stringify(records),'utf8');await fs.rename(file+'.tmp',file)
}
export async function applicationUploadHistory(page){
  if(!['ekpi','dashboard','genset','site','master','ggr','inap','swfm','kpi_b13','kpi_b13_r01','kpi_b13_r02','kpi_b13_r10'].includes(page))throw Object.assign(new Error('Halaman upload tidak valid.'),{status:422})
  const isSource=['master','ggr','inap','swfm','kpi_b13','kpi_b13_r01','kpi_b13_r02','kpi_b13_r10'].includes(page);
  const legacy=isSource?databaseEnabled?(await getPool().query("SELECT CONCAT(source_kind,'-legacy') AS upload_id,filename,upload_date FROM pm_site_sources WHERE source_kind=?",[page]))[0].map(row=>({...row,page})):[]:page==='ekpi'?(await listHistory()).map(row=>({upload_id:row.run_id,filename:row.history?.upload?.filename||row.history?.file,upload_date:row.history?.upload?.date||row.date_end,updated_at:row.updated_at,page})):await preventiveUploadHistory(page)
  let logged=[];
  if(databaseEnabled)logged=(await getPool().query('SELECT upload_id,page,filename,upload_date,row_count,updated_at,history_order FROM application_upload_history WHERE page=? ORDER BY updated_at DESC,history_order DESC',[page]))[0];
  else if(page==='ekpi'){try{logged=JSON.parse(await fs.readFile(path.join(DATA_DIR,'upload-history.json'),'utf8')).filter(row=>row.page===page)}catch(error){if(error.code!=='ENOENT')throw error}}
  const historical=isSource?legacy.filter(row=>!logged.some(item=>item.filename===row.filename&&iso(item.upload_date)===iso(row.upload_date))):legacy
  return [...new Map([...historical,...logged].map(row=>[row.upload_id,{...row,upload_date:iso(row.upload_date)}])).values()].sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))||Number(b.history_order||0)-Number(a.history_order||0))
}
export async function loadPreventiveRows(){const records=databaseEnabled?(await getPool().query('SELECT filename,dataset,upload_date,updated_at FROM preventive_uploads ORDER BY upload_date,updated_at'))[0]:await localPreventiveUploads();return records.flatMap(record=>{const dataset=typeof record.dataset==='string'?JSON.parse(record.dataset):record.dataset;const filename=String(record.filename||'').toLowerCase(),maintenance_kind=dataset?.maintenance_kind||(filename.includes('genset')?'genset':filename.includes('punchlist')?'punchlist':'site');return(dataset?.rows||[]).map(row=>({...row,maintenance_kind:row.maintenance_kind||maintenance_kind,_upload_date:iso(record.upload_date),_updated_at:record.updated_at?.toISOString?.()||record.updated_at}))})}
export async function latestPreventiveUpload(){const rows=databaseEnabled?(await getPool().query('SELECT upload_id,upload_date,filename,dataset,updated_at FROM preventive_uploads ORDER BY upload_date DESC,updated_at DESC LIMIT 1'))[0]:await localPreventiveUploads();const row=rows.sort((a,b)=>String(b.upload_date).localeCompare(String(a.upload_date))||String(b.updated_at).localeCompare(String(a.updated_at)))[0];if(!row)return null;const dataset=typeof row.dataset==='string'?JSON.parse(row.dataset):row.dataset;return{upload_id:row.upload_id,upload_date:iso(row.upload_date),filename:row.filename,row_count:dataset?.row_count||0,data_month:dataset?.data_month,date_start:dataset?.date_start,date_end:dataset?.date_end,updated_at:row.updated_at?.toISOString?.()||row.updated_at}}
