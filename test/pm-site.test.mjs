import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import {analyzeSite,listSites,scheduleLabel,validateEvaluation,siteData,saveEvaluation,normalizeSite,sourceDate} from '../server/pm-site.js'
import {parsePreventiveWorkbook,buildPreventiveDashboard} from '../server/preventive.js'
import {databaseEnabled,getPool,savePreventiveUpload,loadPreventiveRows} from '../server/db.js'

const pm={maintenance_kind:'site',site_id:' abC ',ticket_no:'PMS-A',last_maintenance:'2026-08-20',schedule_date:'2026-09-18',status:'IN PROGRESS'}
const source={master:[{site_id:'ABC',site_name:'Master',nop:'NOP A',latitude:null,longitude:null}],swfm:[],inap:[],ggr:[],evaluations:[]}
test('Last Maintenance and completion remain distinct from Submitted Date',async()=>{
  const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('PM')
  sheet.addRow(['Site ID','Ticket No','Schedule Date','Last Maintenance','Submitted Date','Completed Date','Status'])
  sheet.addRow(['ABC','PMS-A','18-09-2026','20-08-2026','19-09-2026','21-09-2026','SUBMITTED'])
  const data=await parsePreventiveWorkbook(await book.xlsx.writeBuffer(),'PM Site.xlsx')
  assert.equal(data.rows[0].last_maintenance,'2026-08-20');assert.equal(data.rows[0].submitted_date,'2026-09-19');assert.equal(data.rows[0].completed_date,'2026-09-21')
})
test('Work orders with distinct kind or ticket survive the same site and schedule',()=>{
  const rows=[pm,{...pm,ticket_no:'PMS-B'},{...pm,maintenance_kind:'genset',ticket_no:'PMG-A'}]
  assert.equal(buildPreventiveDashboard(rows,'2026-09-01','2026-09-30').rows.length,3)
})
test('Relative schedule excludes Submitted, Closed, Take Out and Canceled from overdue',()=>{
  assert.equal(scheduleLabel(pm,'2026-09-17'),'H-1')
  assert.equal(scheduleLabel(pm,'2026-09-18'),'Hari ini')
  assert.equal(scheduleLabel(pm,'2026-09-21'),'Terlambat 3 hari')
  for(const status of ['SUBMITTED','CLOSED','TAKE OUT','CANCELED'])assert.ok(!scheduleLabel({...pm,status},'2026-09-21').startsWith('Terlambat'))
  assert.equal(scheduleLabel({...pm,status:'SUBMITTED'},'2026-09-21'),'Menunggu approval')
})
test('Correlation uses normalized Site ID, previous maintenance and 30-day cutoff',()=>{
  const data={...source,swfm:[
    {site_id:'abc',source:'swfm',ticket_no:'D0',occurred_at:'2026-08-20T10:00:00'},
    {site_id:'ABC',source:'swfm',ticket_no:'D7',occurred_at:'2026-08-27T00:00:00'},
    {site_id:'ABC',source:'swfm',ticket_no:'D14',occurred_at:'2026-09-03T00:00:00'},
    {site_id:'ABC',source:'swfm',ticket_no:'D30',occurred_at:'2026-09-19T00:00:00'},
    {site_id:'ABC',source:'swfm',ticket_no:'D31',occurred_at:'2026-09-20T00:00:00'},
    {site_id:'OTHER',source:'swfm',ticket_no:'WRONG',occurred_at:'2026-08-22T00:00:00'}
  ]}
  const result=analyzeSite(pm,data,'2026-09-17')
  assert.equal(result.summary.incident_count,4);assert.deepEqual(result.incidents.map(row=>row.bucket),['Hari 0','Hari 1–7','Hari 8–14','Hari 15–30'])
  assert.equal(result.incidents[0].time_confirmation,true);assert.equal(result.master.site_name,'Master')
})
test('SWFM/INAP lineage is counted once while GGR remains separate supporting evidence',()=>{
  const swfm={site_id:'ABC',source:'swfm',ticket_no:'SW1',parent_ticket:'IN1',occurred_at:'2026-08-22T10:00:00',closed_at:'2026-08-22T11:00:00',severity:'MAJOR',rc_category:'POWER',rc1:'PLN Off',rca_validated:'YES'}
  const result=analyzeSite(pm,{...source,swfm:[swfm],inap:[{...swfm,source:'inap',ticket_no:'IN1'}],ggr:[{...swfm,source:'ggr',ticket_no:'GG1'}]})
  assert.equal(result.summary.incident_count,1);assert.equal(result.summary.ggr_count,1);assert.equal(result.summary.total_downtime_minutes,60)
  assert.equal(result.incidents[0].lineage.length,2);assert.equal(result.summary.validated_pln_off,true)
  assert.equal(analyzeSite(pm,{...source,swfm:[{...swfm,rca_validated:'NO'}]}).summary.validated_pln_off,false)
})
test('Missing sources, missing maintenance and master disagreement flag validation',()=>{
  assert.equal(analyzeSite({...pm,last_maintenance:null},{pm:[pm]}).evaluation_label,'Data perlu validasi')
  assert.equal(analyzeSite({...pm,nop:'OLD'},source).evaluation_label,'Data perlu validasi')
  assert.equal(analyzeSite(pm,source).evaluation_label,'Tidak ada indikasi')
})
test('Input rejects invalid dates and evaluation status',()=>{
  assert.equal(sourceDate('31-02-2026'),null);assert.equal(normalizeSite(' abc '),'ABC')
  assert.throws(()=>validateEvaluation({evaluation_status:'Closed',priority:'Tinggi'}))
})
test('Actual files join and filters return with/without incident work orders',async()=>{
  const data=JSON.parse(await fs.readFile(new URL('../data/pm-site-preview.json',import.meta.url),'utf8')),all=listSites(data,{date_from:'2026-09-01',date_to:'2026-09-30'})
  assert.equal(all.rows.length,2124)
  const withIncidents=listSites(data,{incidents:'yes'}),without=listSites(data,{incidents:'no'})
  assert.ok(withIncidents.rows.length>0);assert.ok(without.rows.length>0)
  assert.equal(withIncidents.rows.length+without.rows.length,all.rows.length)
  assert.ok(all.rows.some(row=>row.site_id==='STB710'&&row.site_name==='SEILEPAN'))
  assert.ok(data.swfm.some(row=>!row.rca_validated||!row.rc1))
})
test('MySQL evaluation save, read and edit; same-day PM kinds remain independent',{skip:!databaseEnabled},async()=>{
  const pool=getPool(),[[db]]=await pool.query('SELECT DATABASE() AS name')
  assert.equal(db.name,'pm_site_modular_test','Integration tests require the dedicated test database')
  const data=await siteData(),actual=data.pm.find(row=>row.site_id==='STB710'&&row.maintenance_kind==='site')
  const input={evaluation_status:'Sedang ditindaklanjuti',priority:'Tinggi',evaluator_pic:'Integration test',conclusion:'Disposable verification',follow_up_action:'Verify DB persistence',target_date:'2026-09-30',verification_note:'Test only'}
  const saved=await saveEvaluation(actual,input);assert.equal(saved.evaluation_status,input.evaluation_status)
  const reloaded=await siteData();assert.equal(analyzeSite(actual,reloaded).evaluation.conclusion,input.conclusion)
  const edited=await saveEvaluation(actual,{...input,evaluation_status:'Menunggu verifikasi',verification_note:'Edited in test'})
  assert.equal(edited.id,saved.id);assert.equal(edited.verification_note,'Edited in test')
  await pool.query('DELETE FROM pm_site_evaluations WHERE id=?',[saved.id])
  const date='2026-09-17',[[record]]=await pool.query("SELECT dataset,filename FROM preventive_uploads WHERE upload_date=? AND LOWER(filename) LIKE '%site%'",[date])
  const dataset=typeof record.dataset==='string'?JSON.parse(record.dataset):record.dataset
  const oldCount=(await loadPreventiveRows()).filter(row=>row.maintenance_kind==='genset').length
  assert.equal(await savePreventiveUpload(crypto.randomUUID(),date,record.filename,dataset),1)
  assert.equal((await loadPreventiveRows()).filter(row=>row.maintenance_kind==='genset').length,oldCount)
})
test.after(async()=>{if(databaseEnabled)await getPool().end()})
