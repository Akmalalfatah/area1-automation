import fs from 'node:fs/promises'
import path from 'node:path'
import {enrichGensetSource} from '../server/pm-genset.js'
import {saveSiteSource,siteData} from '../server/pm-site.js'
import {databaseEnabled,initDb,getPool} from '../server/db.js'
import {PROJECT_ROOT,SERVER_DIR} from '../server/config.js'

const downloads=process.env.PM_DATA_DIR||'C:\\Users\\ASUS\\Downloads'
const file=path.join(PROJECT_ROOT,'data','pm-site-preview.json')
const snapshot=JSON.parse(await fs.readFile(file,'utf8'))
if(databaseEnabled)await initDb(SERVER_DIR)
const live=databaseEnabled?await siteData():null
for(const source of snapshot.sources){
  const kind=source.source_kind,buffer=await fs.readFile(path.join(downloads,source.filename))
  await enrichGensetSource(buffer,kind,{rows:snapshot[kind]})
  const current=live?.sources.find(row=>row.source_kind===kind)
  if(current&&current.filename===source.filename){const dataset={rows:live[kind],row_count:live[kind].length,issues:live.quality.filter(row=>row.source===kind).map(({source,...row})=>row)};await enrichGensetSource(buffer,kind,dataset);await saveSiteSource(kind,current.filename,current.upload_date,dataset)}
  console.log(`${kind}: additive fields enriched from ${source.filename}`)
}
await fs.writeFile(file,JSON.stringify(snapshot))
if(databaseEnabled)await getPool().end()
