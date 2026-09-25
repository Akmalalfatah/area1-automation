import test from 'node:test'
import assert from 'node:assert/strict'
import {buildFreshness} from '../server/data-freshness.js'
test('freshness distinguishes missing, current, stale, static and future data per source',()=>{
 const items=buildFreshness({master:{upload_date:'2026-08-01',filename:'Master.xlsx'},site:{upload_date:'2026-09-18',filename:'PM Site.xlsx'},ggr:{upload_date:'2026-09-17'},inap:{upload_date:'2026-09-19'}},'2026-09-18')
 const item=key=>items.find(row=>row.key===key)
 assert.equal(items.length,8);assert.equal(item('master').status,'Tersedia');assert.equal(item('master').cadence_days,null)
 assert.equal(item('site').status,'Tersedia');assert.equal(item('site').latest.filename,'PM Site.xlsx')
 assert.equal(item('ggr').status,'Tersedia');assert.equal(item('ggr').needs_upload,false);assert.equal(item('ggr').needs_update,true)
 assert.equal(item('inap').status,'Tersedia');assert.equal(item('inap').renewal_label,'Tanggal perlu validasi');assert.equal(item('swfm').status,'Belum upload')
})
test('freshness uses configured refresh interval without fabricating an upload date',()=>{
 process.env.FRESHNESS_GGR_DAYS='7'
 try{const rows=buildFreshness({ggr:{upload_date:'2026-09-17'}},'2026-09-18');assert.equal(rows.find(row=>row.key==='ggr').status,'Tersedia');assert.equal(rows.find(row=>row.key==='ggr').needs_update,false);assert.equal(rows.find(row=>row.key==='ggr').cadence,'Setiap 7 hari');assert.equal(rows.find(row=>row.key==='dashboard').latest,null)}finally{delete process.env.FRESHNESS_GGR_DAYS}
})
test('INAP and SWFM renew by calendar month, independently of availability',()=>{
 const rows=buildFreshness({inap:{upload_date:'2026-09-01'},swfm:{upload_date:'2026-08-31'}},'2026-09-30')
 for(const key of ['inap','swfm']){const row=rows.find(item=>item.key===key);assert.equal(row.cadence,'Perbulan');assert.equal(row.status,'Tersedia');assert.equal(row.needs_upload,false)}
 assert.equal(rows.find(row=>row.key==='inap').needs_update,false)
 assert.equal(rows.find(row=>row.key==='swfm').needs_update,true)
})
test('all eight uploaded datasets remain available with their own filename and date',()=>{
 const keys=['master','ggr','inap','swfm','dashboard','genset','site','ekpi']
 const rows=buildFreshness(Object.fromEntries(keys.map(key=>[key,{filename:key+'.xlsx',upload_date:'2026-08-01'}])),'2026-09-18')
 for(const row of rows){assert.equal(row.status,'Tersedia');assert.equal(row.latest.filename,row.key+'.xlsx');assert.equal(row.latest.upload_date,'2026-08-01')}
})
