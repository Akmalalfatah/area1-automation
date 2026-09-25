import fs from 'node:fs/promises'
import path from 'node:path'
import {PROJECT_ROOT,SERVER_DIR} from '../server/config.js'
import {databaseEnabled,initDb,savePreventiveUpload,getPool} from '../server/db.js'
import {saveSiteSource} from '../server/pm-site.js'

if(!databaseEnabled)throw new Error('Konfigurasikan MySQL di server/.env sebelum import snapshot.')
const data=JSON.parse(await fs.readFile(path.join(PROJECT_ROOT,'data','pm-site-preview.json'),'utf8'))
await initDb(SERVER_DIR)
try{
  for(const kind of ['master','swfm','inap','ggr']){
    const meta=data.sources.find(row=>row.source_kind===kind)
    const rows=data[kind]
    if(!meta||!Array.isArray(rows))throw new Error(`Snapshot ${kind} belum tersedia.`)
    await saveSiteSource(kind,meta.filename,meta.upload_date,{rows,row_count:rows.length,issues:(data.quality||[]).filter(issue=>issue.source===kind)})
    console.log(kind,rows.length,'records imported')
  }
  for(const kind of ['site','genset']){
    const rows=data.pm.filter(row=>row.maintenance_kind===kind),dates=rows.map(row=>row.schedule_date).sort()
    const dataset={maintenance_kind:kind,rows,row_count:rows.length,date_start:dates[0],date_end:dates.at(-1),data_month:'2026-09'}
    await savePreventiveUpload(crypto.randomUUID(),'2026-09-17',`PM ${kind==='site'?'Site':'Genset'}_15-09-2026.xlsx`,dataset)
    console.log(kind,rows.length,'work orders imported')
  }
}finally{await getPool().end()}
