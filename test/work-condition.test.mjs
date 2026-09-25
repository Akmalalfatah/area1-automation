import test from 'node:test'
import assert from 'node:assert/strict'
import {enrichWorkConditions} from '../server/work-condition.js'
const row={site_id:'ABC',maintenance_kind:'genset',submitted_date:'2026-09-10',schedule_date:'2026-09-10',last_maintenance:'2026-09-10'}
const source={master:[],ggr:[],inap:[],swfm:[]}
test('condition distinguishes missing PM anchor and incomplete sources from recorded zero',()=>{
 assert.equal(enrichWorkConditions([{...row,submitted_date:null}],source)[0].condition_label,'Belum dapat dievaluasi')
 assert.equal(enrichWorkConditions([row],{})[0].condition_label,'Belum dapat dievaluasi')
 assert.equal(enrichWorkConditions([row],source)[0].condition_label,'Tidak ada gangguan tercatat')
})
test('Genset badge uses normalized site and after-PM window without unrelated incidents',()=>{
 const ggr=[{site_id:' abc ',ticket_no:'G1',occurred_at:'2026-09-11T10:00:00'},{site_id:'OTHER',ticket_no:'G2',occurred_at:'2026-09-11T10:00:00'}]
 assert.equal(enrichWorkConditions([row],{...source,ggr})[0].condition_count,1)
 assert.equal(enrichWorkConditions([row],{...source,ggr})[0].condition_tone,'red')
 assert.equal(enrichWorkConditions([row],{...source,ggr:[{...ggr[0],occurred_at:'2026-09-01T10:00:00'}]})[0].condition_count,0)
})
test('Site badge uses previous maintenance window and review reasons remain visible',()=>{
 const site={...row,maintenance_kind:'site'}
 assert.equal(enrichWorkConditions([site],{...source,ggr:[{site_id:'ABC',ticket_no:'G1',occurred_at:'2026-09-20T10:00:00'}]})[0].condition_label,'Gangguan tercatat');
 assert.equal(enrichWorkConditions([{...site,review_reasons:['NOP berbeda']}],source)[0].condition_label,'Perlu ditinjau')
})
