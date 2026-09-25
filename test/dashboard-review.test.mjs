import test from 'node:test'
import assert from 'node:assert/strict'
import {enrichDashboardReview} from '../server/dashboard-review.js'
const master={site_id:'TEST001',nop:'Binjai',active:'Ya',genset_active:'Ya',latitude:1,longitude:100}
test('dashboard joins master and prioritizes discrepancies without treating submitted as overdue',()=>{
 const rows=enrichDashboardReview([{site_id:'TEST001',nop:'NOP Binjai',status:'SUBMITTED',schedule_date:'2026-09-01'},{site_id:'MISSING',status:'IN PROGRESS',schedule_date:'2026-09-01'}],{master:[master]},'2026-09-18')
 assert.equal(rows[0].site_id,'MISSING');assert.equal(rows[0].review_reasons.length,2)
 assert.equal(rows[1].review_reasons.length,0);assert.equal(rows[1].master,master)
})
test('rejected, inactive genset, NOP mismatch and invalid coordinates are visible evidence',()=>{
 const [row]=enrichDashboardReview([{site_id:'test001',nop:'Medan',status:'REJECTED',maintenance_kind:'genset',schedule_date:'2026-10-01'}],{master:[{...master,genset_active:'Tidak',latitude:99}]},'2026-09-18')
 assert.equal(row.review_reasons.length,4)
 assert.equal(row.review_label,'Perlu ditinjau')
})
