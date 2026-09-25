import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {databaseEnabled,initDb,getPool,savePreventiveUpload,applicationUploadHistory,preventiveUploadHistory,saveHistory,loadHistoryDataset} from '../server/db.js'
import {SERVER_DIR} from '../server/config.js'
test('MySQL remembers independent upload pages and keeps replacement metadata', {skip:!databaseEnabled},async()=>{
  assert.equal(process.env.DB_NAME,'pm_site_modular_test','Run this integration test only against the isolated project test database')
  await initDb(SERVER_DIR);const ids=Array.from({length:4},()=>crypto.randomUUID()),date='2099-11-30'
  const [[existing]]=await getPool().query('SELECT COUNT(*) AS total FROM preventive_uploads WHERE upload_date=?',[date]);assert.equal(existing.total,0)
  const dataset=page=>({maintenance_kind:'site',upload_page:page,row_count:1,rows:[{maintenance_kind:'site',site_id:'TEST-PERSIST',schedule_date:date}]})
  try{
    await savePreventiveUpload(ids[0],date,'PM Site initial.xlsx',dataset('site'))
    await savePreventiveUpload(ids[1],date,'PM Site dashboard.xlsx',dataset('dashboard'))
    assert.equal(await savePreventiveUpload(ids[2],date,'PM Site updated.xlsx',dataset('site')),1)
    assert.equal((await preventiveUploadHistory('site')).find(row=>row.upload_id===ids[2]).filename,'PM Site updated.xlsx')
    assert.ok((await applicationUploadHistory('site')).some(row=>row.upload_id===ids[0]))
    assert.ok((await applicationUploadHistory('dashboard')).some(row=>row.upload_id===ids[1]))
    assert.ok(!(await applicationUploadHistory('genset')).some(row=>ids.includes(row.upload_id)))
    await saveHistory(ids[3],{date,file:'KPI remember.xlsx',nops:[{name:'TEST'}]},{filename:'KPI remember.xlsx',date})
    assert.equal((await loadHistoryDataset(ids[3])).file,'KPI remember.xlsx')
    assert.ok((await applicationUploadHistory('ekpi')).some(row=>row.upload_id===ids[3]&&row.filename==='KPI remember.xlsx'))
  }finally{
    await getPool().query('DELETE FROM preventive_uploads WHERE upload_id IN (?)',[ids])
    await getPool().query('DELETE FROM kpi_history WHERE run_id IN (?)',[ids])
    await getPool().query('DELETE FROM application_upload_history WHERE upload_id IN (?)',[ids])
    await getPool().end()
  }
})
