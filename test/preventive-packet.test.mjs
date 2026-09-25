import test from 'node:test'
import assert from 'node:assert/strict'
import {assertPreventivePacketSize} from '../server/db.js'
test('checks the actual escaped SQL packet before changing persisted uploads',()=>{
  assert.throws(()=>assertPreventivePacketSize(1300000,1048576),error=>error.status===503&&error.code==='PM_PACKET_TOO_LARGE'&&error.message.includes('max_allowed_packet=64M'))
  assert.throws(()=>assertPreventivePacketSize(1048576,1048576))
  assert.doesNotThrow(()=>assertPreventivePacketSize(1300000,67108864))
})
