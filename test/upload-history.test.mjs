import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pm-upload-history-'))
process.env.USE_DATABASE='false';process.env.APP_DATA_DIR=temp
const db=await import('../server/db.js')
const {siteData}=await import('../server/pm-site.js')
const {createRun,uploadAndProcess}=await import('../server/services.js')
const ExcelJS=(await import('exceljs')).default
test('local PM persistence, independent page history, replacements and concurrent uploads',async()=>{
  const dataset=kind=>({maintenance_kind:kind,row_count:1,date_start:'2026-09-15',date_end:'2026-09-15',rows:[{maintenance_kind:kind,site_id:'LOCAL-TEST',schedule_date:'2026-09-15',ticket_no:'LOCAL-'+kind}]})
  await Promise.all([
    db.savePreventiveUpload('site-first','2026-09-17','PM Site first.xlsx',{...dataset('site'),upload_page:'site'}),
    db.savePreventiveUpload('genset-first','2026-09-17','PM Genset first.xlsx',{...dataset('genset'),upload_page:'genset'}),
    db.savePreventiveUpload('dash-first','2026-09-17','PM Site dashboard.xlsx',{...dataset('site'),upload_page:'dashboard'})
  ])
  assert.equal(await db.savePreventiveUpload('site-second','2026-09-17','PM Site second.xlsx',{...dataset('site'),upload_page:'site'}),1)
  assert.equal((await db.applicationUploadHistory('site')).length,2)
  assert.equal((await db.applicationUploadHistory('genset'))[0].filename,'PM Genset first.xlsx')
  assert.equal((await db.applicationUploadHistory('dashboard'))[0].filename,'PM Site dashboard.xlsx')
  assert.equal((await db.loadPreventiveRows()).length,3)
  assert.ok((await siteData()).pm.some(row=>row.ticket_no==='LOCAL-site'))
  const result=execFileSync(process.execPath,['--input-type=module','-e',"const db=await import('./server/db.js');console.log(JSON.stringify({rows:(await db.loadPreventiveRows()).length,site:(await db.applicationUploadHistory('site')).length}))"],{cwd:path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')),env:process.env,encoding:'utf8'})
  assert.deepEqual(JSON.parse(result.trim().split('\n').at(-1)),{rows:3,site:2})
})
test('eKPI discovers persisted local runs without browser localStorage',async()=>{
  const folder=path.join(temp,'runs','remember-kpi');await fs.mkdir(folder,{recursive:true})
  await fs.writeFile(path.join(folder,'state.json'),JSON.stringify({id:'remember-kpi',processed:true,upload:{filename:'KPIData.xlsx',date:'2026-09-17',nop_count:17}}))
  const items=await db.listHistory();assert.equal(items[0].run_id,'remember-kpi');assert.equal((await db.applicationUploadHistory('ekpi'))[0].filename,'KPIData.xlsx')
  assert.equal((await db.listHistory({month:8})).length,0)
})
test('actual API keeps PM uploads visible after reopening and rejects wrong page',async()=>{
  const app=(await import('../server/index.js')).default,server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+server.address().port
  try{
    const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('PM');sheet.addRow(['Site ID','Schedule Date','Status','PIC']);sheet.addRow(['UPLOAD-API','2026-09-15','IN PROGRESS','PIC test'])
    const buffer=await book.xlsx.writeBuffer(),form=new FormData();form.append('file',new Blob([buffer]),'PM Site API.xlsx');form.append('upload_date','2026-09-18');form.append('upload_page','site')
    const uploaded=await fetch(base+'/api/preventive/upload',{method:'POST',body:form});assert.equal(uploaded.status,200)
    const history=await (await fetch(base+'/api/uploads?page=site')).json();assert.equal(history.items[0].filename,'PM Site API.xlsx');assert.equal(history.items[0].upload_date,'2026-09-18')
    const dashboard=await (await fetch(base+'/api/preventive/dashboard?maintenance_type=genset&date_from=2026-09-01&date_to=2026-09-30')).json();assert.equal(dashboard.latest_upload.filename,'PM Genset first.xlsx')
    const site=await (await fetch(base+'/api/pm-site?date_from=2026-09-01&date_to=2026-09-30')).json();assert.ok(site.rows.some(row=>row.site_id==='UPLOAD-API'))
    assert.equal((await fetch(base+'/api/uploads?page=unknown')).status,422)
    const {NOP_ORDER,SOURCE_ROWS}=await import('../server/constants.js')
    const kpi=new ExcelJS.Workbook(),kpiSheet=kpi.addWorksheet('Sheet3');kpiSheet.getRow(2).values=['Komponen',...NOP_ORDER]
    for(const row of Object.values(SOURCE_ROWS))kpiSheet.getRow(row).values=['Komponen',...NOP_ORDER.map(()=>90)]
    const runs=path.join(temp,'runs'),run=await createRun(runs)
    await uploadAndProcess(runs,run.id,{originalname:'KPI API.xlsx',buffer:await kpi.xlsx.writeBuffer()},'2026-09-18')
    const remembered=await (await fetch(base+'/api/history')).json();assert.equal(remembered.items[0].history.upload.filename,'KPI API.xlsx')
    const kpiHistory=await (await fetch(base+'/api/uploads?page=ekpi')).json();assert.ok(kpiHistory.items.some(row=>row.filename==='KPI API.xlsx'))
    const restored=await (await fetch(base+`/api/runs/${run.id}/dashboard`)).json();assert.equal(restored.dataset.file,'KPI API.xlsx')
  }finally{await new Promise(resolve=>server.close(resolve))}
})
test.after(async()=>{await fs.rm(temp,{recursive:true,force:true})})
