import test from 'node:test'
import assert from 'node:assert/strict'
import {analyzeGenset,mergePowerTickets,validateGensetEvaluation,saveGensetEvaluation,gensetData,enrichGensetSource} from '../server/pm-genset.js'
import {databaseEnabled,getPool,initDb} from '../server/db.js'
import {SERVER_DIR} from '../server/config.js'
import ExcelJS from 'exceljs'

const pm={maintenance_kind:'genset',site_id:' aBc ',ticket_no:'PMG-TEST',schedule_date:'2026-09-08',submitted_date:'2026-09-10',status:'SUBMITTED'}
const base={master:[{site_id:'ABC',latitude:null,longitude:null}],ggr:[],swfm:[],inap:[]}
const coverage=Object.fromEntries(['ggr','swfm','inap'].map(source=>[source,{start:'2026-09-01',end:'2026-09-20'}]))
const event=(ticket,when,extra={})=>({site_id:'ABC',source:'ggr',ticket_no:ticket,occurred_at:when,closed_at:when.slice(0,10)+'T12:00:00',...extra})
test('date-only submission excludes PM day, uses two equal seven-day windows and cutoff edges',()=>{
 const data={...base,ggr:[event('B','2026-09-03T11:00:00'),event('DAY','2026-09-10T11:00:00'),event('A','2026-09-17T11:00:00'),event('OUT','2026-09-18T11:00:00'),event('WRONG','2026-09-11T11:00:00',{site_id:'OTHER'})]}
 const result=analyzeGenset(pm,data,{coverage})
 assert.equal(result.metrics[0].before,1);assert.equal(result.metrics[0].after,1);assert.equal(result.metrics[1].after,60)
 assert.equal(result.events.find(row=>row.ticket_no==='DAY').period,'Hari PM · perlu konfirmasi');assert.equal(result.events.length,3);assert.equal(result.master.latitude,null);assert.equal(result.master.longitude,null)
 assert.equal((Date.parse(result.windows.before_end)-Date.parse(result.windows.before_start)),7*86400000)
 assert.equal((Date.parse(result.windows.after_end)-Date.parse(result.windows.after_start)),7*86400000)
})
test('uses submission wording unless CLOSED has an actual closing timestamp',()=>{
 assert.equal(analyzeGenset({...pm,status:'CLOSED',completed_date:'2026-09-12'},base).anchor_label,'setelah submission PM')
 assert.equal(analyzeGenset({...pm,status:'CLOSED',closed_at:'2026-09-12T10:00:00'},base).anchor_label,'setelah PM selesai')
})
test('joins only normalized site + ticket lineage; filters category/recorded RCA Power, excludes transport',()=>{
 const swfm=event('WFM','2026-09-11T11:00:00',{source:'swfm',parent_ticket:'IN1',rc_category:'Power',sla:'OUT SLA',rc1:'PLN Off'})
 const data={...base,swfm:[swfm,event('TRANSPORT','2026-09-11T11:00:00',{source:'swfm',rc_category:'Transport',summary:'genset'})],inap:[{...swfm,source:'inap',ticket_no:'IN1',rc_category:'',sla:'IN SLA'}]}
 const rows=mergePowerTickets(data,'ABC');assert.equal(rows.length,1);assert.equal(rows[0].lineage.length,2);assert.equal(rows[0].sla_state,'Out SLA')
 const result=analyzeGenset(pm,{...data,ggr:[event('GG','2026-09-11T11:00:00')]},{coverage})
 assert.equal(result.metrics[2].after,1);assert.equal(result.evidence.out_sla,1);assert.equal(result.priority,'Tinggi')
})
test('Power tickets far from GGR are not related evidence; RCA is not invented',()=>{
 const data={...base,ggr:[event('GG','2026-09-11T11:00:00')],swfm:[event('W','2026-09-16T11:00:00',{source:'swfm',rc_category:'Power',sla:'OUT SLA'})]}
 const result=analyzeGenset(pm,data,{coverage});assert.equal(result.evidence.related_power,0);assert.equal(result.evidence.out_sla,0);assert.equal(result.priority,'Sedang');assert.ok(result.missing.some(text=>text.includes('tidak memiliki ticket')))
 assert.equal(result.events[0].rc1,undefined)
})
test('missing PM/source does not become fabricated zero; unknown duration stays unavailable',()=>{
 const empty=analyzeGenset({...pm,submitted_date:null},{});assert.equal(empty.status,'Belum dapat dievaluasi');assert.ok(empty.metrics.every(row=>row.before===null&&row.after===null));assert.equal(empty.master,null)
 const incomplete=analyzeGenset(pm,{master:base.master});assert.equal(incomplete.metrics[0].after,null);assert.equal(incomplete.metrics[2].after,null)
 const result=analyzeGenset(pm,{...base,ggr:[event('GG','2026-09-11T11:00:00',{closed_at:null})]},{coverage});assert.equal(result.metrics[1].after,null);assert.equal(result.reliability.longest_minutes,null)
})
test('zero baseline has finite change; stability requires declared full source coverage',()=>{
 const risk=analyzeGenset(pm,{...base,ggr:[event('GG','2026-09-11T11:00:00')]},{coverage});assert.equal(risk.metrics[0].percent,null);assert.equal(risk.metrics[0].zero_baseline,true)
 assert.equal(analyzeGenset(pm,base).status,'Belum cukup data untuk evaluasi');assert.equal(analyzeGenset(pm,base,{coverage}).status,'Kondisi relatif stabil')
 assert.throws(()=>analyzeGenset(pm,base,{windowDays:0}),/1–90/)
})
test('invalid PM dates and unknown after duration do not create percentages or fabricated indicators',()=>{
 const invalid=analyzeGenset({...pm,submitted_date:'not-a-date'},base);assert.equal(invalid.anchor,null);assert.equal(invalid.status,'Belum dapat dievaluasi')
 const result=analyzeGenset(pm,{...base,ggr:[event('BEFORE','2026-09-05T11:00:00'),event('AFTER','2026-09-11T11:00:00',{closed_at:null})]},{coverage})
 assert.equal(result.metrics[1].percent,null);assert.equal(result.metrics[1].complete,false)
 assert.equal(result.timeline_related.length,2)
})
test('manual evaluation validation rejects invalid values and calendars',()=>{
 const form={evaluation_status:'Perlu ditinjau',follow_up_pic:'PIC',conclusion:'Verifikasi',follow_up_action:'Load test',additional_note:'',target_date:'2026-09-20'}
 assert.equal(validateGensetEvaluation(form).target_date,'2026-09-20')
 assert.throws(()=>validateGensetEvaluation({...form,evaluation_status:'PM gagal'}));assert.throws(()=>validateGensetEvaluation({...form,target_date:'2026-02-30'}))
})
test('source enrichment adds available genset maintenance/PIC without changing existing fields',async()=>{
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Master');sheet.addRow(['Site ID','Genset Capacity','Last Maintenance Genset']);sheet.addRow(['ABC',20,'2026-08-10'])
 const row={site_id:'ABC',source_row:2,latitude:1,longitude:2,genset_capacity:20};const result=await enrichGensetSource(await book.xlsx.writeBuffer(),'master',{rows:[{...row}]})
 assert.equal(result.rows[0].genset_last_maintenance,'2026-08-10');for(const field of Object.keys(row))assert.equal(result.rows[0][field],row[field])
})
test('MySQL evaluation upserts per Site ID + PM ticket + period, isolated from PM Site', {skip:!databaseEnabled},async()=>{
 await initDb(SERVER_DIR);const testPm={...pm,site_id:'TEST-GENSET-ONLY',ticket_no:'PMG-TEST-GENSET-ONLY'}
 const form={evaluation_status:'Perlu ditinjau',follow_up_pic:'Test',conclusion:'Test',follow_up_action:'Test',additional_note:'',target_date:''}
 try {const first=await saveGensetEvaluation(testPm,form);assert.equal(first.site_id,'TEST-GENSET-ONLY');assert.equal(first.evaluation_status,'Perlu ditinjau')
 await saveGensetEvaluation(testPm,{...form,evaluation_status:'Selesai dievaluasi'});await saveGensetEvaluation({...testPm,schedule_date:'2026-10-08'},form)
 const [rows]=await getPool().query('SELECT * FROM pm_genset_evaluations WHERE site_id=?',['TEST-GENSET-ONLY']);assert.equal(rows.length,2);assert.ok(rows.some(row=>row.evaluation_status==='Selesai dievaluasi'))
 const [[count]]=await getPool().query('SELECT COUNT(*) AS total FROM pm_site_evaluations WHERE site_id=?',['TEST-GENSET-ONLY']);assert.equal(count.total,0)
 const data=await gensetData();assert.ok(Array.isArray(data.genset_evaluations))
 }finally{await getPool().query('DELETE FROM pm_genset_evaluations WHERE site_id=? AND pm_ticket_no=?',['TEST-GENSET-ONLY','PMG-TEST-GENSET-ONLY']);await getPool().end()}
})
