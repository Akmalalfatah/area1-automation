import './config.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import mysql from 'mysql2/promise'

const enabled=!['0','false','no'].includes((process.env.USE_DATABASE||'true').toLowerCase())
const settings={host:process.env.DB_HOST||'',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||''}
export const databaseEnabled=enabled&&Boolean(settings.host&&settings.user&&settings.database)
let pool

function getPool(){
  if(!databaseEnabled)throw new Error('DB_HOST, DB_USER, dan DB_NAME belum dikonfigurasi di Environment Variables.')
  if(!pool)pool=mysql.createPool({...settings,waitForConnections:true,connectionLimit:5,queueLimit:0,charset:'utf8mb4',dateStrings:true})
  return pool
}

const iso=value=>value instanceof Date?value.toISOString().slice(0,10):String(value).slice(0,10)
const json=value=>JSON.stringify(value)

export async function initDb(serverDir){
  if(!databaseEnabled)return
  const sql=await fs.readFile(path.join(serverDir,'sql','schema.mysql.sql'),'utf8')
  for(const statement of sql.split(/;\s*(?:\r?\n|$)/).map(x=>x.trim()).filter(Boolean))await getPool().query(statement)
}

export async function saveHistory(runId,dataset,upload){
  if(!databaseEnabled)return []
  const date=dataset.date,title=`KPI ${new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T00:00:00Z`))}`
  const history={run_id:runId,title,date,file:dataset.file||'',upload,nop_count:dataset.nops?.length||0},connection=await getPool().getConnection()
  try{
    await connection.beginTransaction()
    const [replaced]=await connection.query('SELECT run_id FROM kpi_history WHERE date_end=? AND run_id<>?',[date,runId]),ids=replaced.map(row=>row.run_id)
    if(ids.length)await connection.query('DELETE FROM kpi_history WHERE run_id IN (?)',[ids])
    await connection.query(`INSERT INTO kpi_history (run_id,title,date_start,date_end,year,month,day,dataset,uploads,history)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),date_start=VALUES(date_start),date_end=VALUES(date_end),year=VALUES(year),month=VALUES(month),day=VALUES(day),dataset=VALUES(dataset),uploads=VALUES(uploads),history=VALUES(history),updated_at=CURRENT_TIMESTAMP`,[runId,title,date,date,Number(date.slice(0,4)),Number(date.slice(5,7)),Number(date.slice(8,10)),json(dataset),json(upload),json(history)])
    await connection.commit();return ids
  }catch(error){await connection.rollback();throw error}finally{connection.release()}
}

export async function listHistory({day,month,year}={}){
  if(!databaseEnabled)return []
  const clauses=[],params=[];for(const [key,value] of Object.entries({year,month,day}))if(value){clauses.push(`${key}=?`);params.push(Number(value))}
  const [rows]=await getPool().query(`SELECT run_id,title,date_start,date_end,year,month,day,history,created_at,updated_at FROM kpi_history ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''} ORDER BY date_end DESC,created_at DESC LIMIT 100`,params)
  return rows.map(row=>({...row,date_start:iso(row.date_start),date_end:iso(row.date_end),history:typeof row.history==='string'?JSON.parse(row.history):row.history,created_at:row.created_at?.toISOString?.()||row.created_at,updated_at:row.updated_at?.toISOString?.()||row.updated_at}))
}

export async function loadHistoryDataset(runId){if(!databaseEnabled)return null;const [rows]=await getPool().query('SELECT dataset FROM kpi_history WHERE run_id=?',[runId]);const value=rows[0]?.dataset;return typeof value==='string'?JSON.parse(value):value||null}
export async function loadPreviousHistoryDataset(runId,currentDate){if(!databaseEnabled||!currentDate)return null;const [rows]=await getPool().query('SELECT dataset FROM kpi_history WHERE run_id<>? AND date_end<? ORDER BY date_end DESC,created_at DESC LIMIT 1',[runId,currentDate]);const value=rows[0]?.dataset;return typeof value==='string'?JSON.parse(value):value||null}
export async function deleteHistory(runIds){if(!databaseEnabled)throw new Error('Database history belum dikonfigurasi.');const [result]=await getPool().query('DELETE FROM kpi_history WHERE run_id IN (?)',[runIds]);return result.affectedRows}

export async function savePreventiveUpload(uploadId,uploadDate,filename,dataset){
  if(!databaseEnabled)throw new Error('Database MySQL belum dikonfigurasi.')
  const connection=await getPool().getConnection()
  try{await connection.beginTransaction();const [[count]]=await connection.query('SELECT COUNT(*) AS count FROM preventive_uploads WHERE upload_date=? AND upload_id<>?',[uploadDate,uploadId]);await connection.query('DELETE FROM preventive_uploads WHERE upload_date=? AND upload_id<>?',[uploadDate,uploadId]);await connection.query(`INSERT INTO preventive_uploads(upload_id,upload_date,filename,dataset) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE upload_date=VALUES(upload_date),filename=VALUES(filename),dataset=VALUES(dataset),updated_at=CURRENT_TIMESTAMP`,[uploadId,uploadDate,filename,json(dataset)]);await connection.commit();return Number(count.count)}catch(error){await connection.rollback();throw error}finally{connection.release()}
}

export async function loadPreventiveRows(){if(!databaseEnabled)return [];const [records]=await getPool().query('SELECT filename,dataset,upload_date,updated_at FROM preventive_uploads ORDER BY upload_date,updated_at');return records.flatMap(record=>{const dataset=typeof record.dataset==='string'?JSON.parse(record.dataset):record.dataset;const filename=String(record.filename||'').toLowerCase(),maintenance_kind=dataset?.maintenance_kind||(filename.includes('genset')?'genset':filename.includes('punchlist')?'punchlist':'site');return(dataset?.rows||[]).map(row=>({...row,maintenance_kind:row.maintenance_kind||maintenance_kind,_upload_date:iso(record.upload_date),_updated_at:record.updated_at?.toISOString?.()||record.updated_at}))})}
export async function latestPreventiveUpload(){if(!databaseEnabled)return null;const [rows]=await getPool().query('SELECT upload_id,upload_date,filename,dataset,updated_at FROM preventive_uploads ORDER BY upload_date DESC,updated_at DESC LIMIT 1');const row=rows[0];if(!row)return null;const dataset=typeof row.dataset==='string'?JSON.parse(row.dataset):row.dataset;return{upload_id:row.upload_id,upload_date:iso(row.upload_date),filename:row.filename,row_count:dataset?.row_count||0,data_month:dataset?.data_month,date_start:dataset?.date_start,date_end:dataset?.date_end,updated_at:row.updated_at?.toISOString?.()||row.updated_at}}
