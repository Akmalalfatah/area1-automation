import fs from 'node:fs/promises'
import path from 'node:path'
import {parseSiteSource,saveSiteSource} from '../server/pm-site.js'
import {enrichGensetSource} from '../server/pm-genset.js'
import {parsePreventiveWorkbook} from '../server/preventive.js'
import {databaseEnabled,savePreventiveUpload,initDb,getPool} from '../server/db.js'
import {PROJECT_ROOT,SERVER_DIR} from '../server/config.js'

const downloads=process.env.PM_DATA_DIR||'C:\\Users\\ASUS\\Downloads'
const sources={master:'ExportMasterSiteDetail_11-09-2026.xlsx',swfm:'Ticket_SWFM_14-09-2026 22_26_50.xlsx',inap:'Ticket_INAP_11-09-2026 14_33_15.xlsx',ggr:'Export_GGR_17-09-2026 09_01_18.xlsx'}
const data={sources:[],pm:[],quality:[]}
const date='2026-09-17'
if(databaseEnabled)await initDb(SERVER_DIR)
for(const [kind,filename] of Object.entries(sources)){
  const buffer=await fs.readFile(path.join(downloads,filename))
  const dataset=await enrichGensetSource(buffer,kind,await parseSiteSource(buffer,kind))
  data[kind]=dataset.rows;data.sources.push({source_kind:kind,filename,upload_date:date,row_count:dataset.row_count,issue_count:dataset.issues.length})
  data.quality.push(...dataset.issues.map(issue=>({...issue,source:kind})))
  if(databaseEnabled)await saveSiteSource(kind,filename,date,dataset)
  console.log(kind, dataset.row_count, 'records', dataset.issues.length, 'issues')
}
for(const [kind,relative] of [['site','PM Site/PM Site_15-09-2026.xlsx'],['genset','PM Genset/PM Genset_15-09-2026.xlsx']]){
  const dataset=await parsePreventiveWorkbook(await fs.readFile(path.join(downloads,relative)),path.basename(relative))
  data.pm.push(...dataset.rows)
  if(databaseEnabled)await savePreventiveUpload(crypto.randomUUID(),date,path.basename(relative),dataset)
  console.log(kind,dataset.row_count,'work orders')
}
await fs.mkdir(path.join(PROJECT_ROOT,'data'),{recursive:true})
await fs.writeFile(path.join(PROJECT_ROOT,'data','pm-site-preview.json'),JSON.stringify(data))
console.log(databaseEnabled?'Actual sources imported to MySQL.':'Actual snapshot ready for read-only preview; no evaluations stored outside MySQL.')
if(databaseEnabled)await getPool().end()
