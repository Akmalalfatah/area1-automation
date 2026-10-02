import test from 'node:test'
import assert from 'node:assert/strict'
import {MTTR_TARGETS_BY_COMPONENT,buildMttrMetrics,percentileInc,ticketNeedForTarget} from '../server/services.js'

test('target MTTR mengikuti kombinasi komponen dan severity',()=>{
  assert.deepEqual(MTTR_TARGETS_BY_COMPONENT.B_1,{CRITICAL:4,MAJOR:8,MINOR:10,LOW:13})
  assert.deepEqual(MTTR_TARGETS_BY_COMPONENT['B_2.1'],{CRITICAL:2,MAJOR:4,MINOR:15})
  assert.deepEqual(MTTR_TARGETS_BY_COMPONENT['B_2.2'],{CRITICAL:2,LOW:48})
  assert.deepEqual(MTTR_TARGETS_BY_COMPONENT['B_2.3'],{MAJOR:4,MINOR:15})
  assert.deepEqual(MTTR_TARGETS_BY_COMPONENT.B_3,{MINOR:15,LOW:48,'VERY LOW':96})
})

test('P90 menggunakan metode PERCENTILE.INC',()=>{
  assert.equal(percentileInc([1,10],.9),9.1)
})

test('kebutuhan ticket menambah ticket MTTR satu jam tanpa mengubah aktual',()=>{
  const actual=[{mttr_hours:10}],result=ticketNeedForTarget(actual,4)
  assert.equal(result.needed,7)
  assert.ok(Math.abs(result.simulated-3.7)<1e-9)
  assert.deepEqual(actual,[{mttr_hours:10}])
  assert.ok(result.candidates.every(ticket=>ticket.mttr_hours===1))
})

test('simulasi berhenti pada jumlah minimum untuk target B.2.1 Critical',()=>{
  const result=buildMttrMetrics({CRITICAL:[10]},MTTR_TARGETS_BY_COMPONENT['B_2.1'])[0]
  assert.equal(result.target,2)
  assert.equal(result.needed,9)
  assert.ok(Math.abs(result.projectedP90-1.9)<1e-9)
})
