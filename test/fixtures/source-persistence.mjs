import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import app from '../../server/index.js'
import {getPool} from '../../server/db.js'
import {siteData,analyzeSite} from '../../server/pm-site.js'
import {gensetData,analyzeGenset} from '../../server/pm-genset.js'
import {NOP_ORDER,SOURCE_ROWS} from '../../server/constants.js'

const server=app.listen(0,'127.0.0.1')
await new Promise(resolve=>server.once('listening',resolve))
const base='http://127.0.0.1:'+server.address().port
const get=async url=>{const response=await fetch(base+url);assert.equal(response.status,200);return response.json()}
async function upload(url,filename,headers,values,page){
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Source')
 sheet.addRow(headers);sheet.addRow(values)
 const form=new FormData();form.append('file',new Blob([await book.xlsx.writeBuffer()]),filename);form.append('upload_date','2026-09-18')
 if(page)form.append('upload_page',page)
 const response=await fetch(base+url,{method:'POST',body:form}),body=await response.json()
 assert.equal(response.status,200,JSON.stringify(body));return body
}
try{
 if(process.argv[2]==='upload'){
  for(const name of ['Master initial.xlsx','Master replacement.xlsx'])await upload('/api/pm-site/sources/master',name,['Site ID','Site Name','LAT','LON','NOP','Genset Capacity'],['TEST001','Shared master',1,100,'Test NOP',20])
  await upload('/api/pm-site/sources/ggr','GGR.xlsx',['Site','Ticket No','Period Down','End Time'],['TEST001','GGR001','2026-09-11 10:00:00','2026-09-11 11:00:00'])
  await upload('/api/pm-site/sources/inap','INAP.xlsx',['Site','TT Number','Occured Time','Cleared Time','rootcause1'],['TEST001','IN001','2026-09-11 10:00:00','2026-09-11 11:00:00','PLN Off'])
  await upload('/api/pm-site/sources/swfm','SWFM.xlsx',['Site ID','Ticket Number SWFM','Ticket Number Inap','Occured Time','Closed At','RC Category','SLA Status'],['TEST001','SW001','IN001','2026-09-11 10:00:00','2026-09-11 11:00:00','Power','OUT SLA'])
  for(const page of ['site','genset','dashboard'])await upload('/api/preventive/upload',page==='genset'?'PM Genset.xlsx':page==='site'?'PM Site.xlsx':'PM Punchlist.xlsx',['Site ID','Ticket No','Schedule Date','Submitted Date','Last Maintenance','Status'],['TEST001','PM-'+page,'2026-09-10','2026-09-10','2026-09-10','SUBMITTED'],page)
  const run=await (await fetch(base+'/api/runs',{method:'POST'})).json()
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Sheet3');sheet.getRow(2).values=['Komponen',...NOP_ORDER]
  for(const row of Object.values(SOURCE_ROWS))sheet.getRow(row).values=['Komponen',...NOP_ORDER.map(()=>90)]
  const form=new FormData();form.append('file',new Blob([await book.xlsx.writeBuffer()]),'eKPI.xlsx');form.append('upload_date','2026-09-18')
  const response=await fetch(base+'/api/runs/'+run.id+'/upload',{method:'POST',body:form});assert.equal(response.status,200,await response.text())
 }
 const freshness=await get('/api/data-freshness')
 assert.equal(freshness.items.length,8)
 for(const row of freshness.items){assert.equal(row.status,'Tersedia',row.key);assert.equal(row.latest.upload_date,'2026-09-18',row.key)}
 for(const key of ['inap','swfm'])assert.equal(freshness.items.find(row=>row.key===key).cadence,'Perbulan')
 const history=await get('/api/uploads?page=master');assert.equal(history.items.length,2);assert.equal(history.items[0].filename,'Master replacement.xlsx')
 assert.equal((await get('/api/uploads?page=site')).items[0].filename,'PM Site.xlsx')
 const data=await siteData();assert.equal(data.master.length,1);assert.equal(data.master[0].site_name,'Shared master')
 const site=analyzeSite(data.pm.find(row=>row.maintenance_kind==='site'),data,'2026-09-18')
 assert.equal(site.master.site_name,'Shared master');assert.equal(site.summary.ggr_count,1);assert.equal(site.summary.incident_count,1)
 const genset=await gensetData(),evaluation=analyzeGenset(genset.pm.find(row=>row.maintenance_kind==='genset'),genset)
 assert.equal(evaluation.master.site_name,'Shared master');assert.equal(evaluation.metrics[0].after,1);assert.equal(evaluation.metrics[1].after,60);assert.equal(evaluation.metrics[2].after,1)
 assert.equal((await getPool().query('SELECT COUNT(*) AS n FROM pm_site_source_rows'))[0][0].n,4)
 console.log('Eight sources available; replacement, persistence and both evaluations verified')
}finally{await new Promise(resolve=>server.close(resolve));await getPool().end()}
