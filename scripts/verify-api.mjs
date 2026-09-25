import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const base=process.env.PM_TEST_URL||'http://127.0.0.1:3021'
async function api(url,options){const response=await fetch(base+url,options),payload=await response.json();assert.equal(response.status,200,payload.detail);return payload}
const config=await api('/api/config');assert.equal(config.database_enabled,true)
const overview=await api('/api/preventive/dashboard?date_from=2026-09-01&date_to=2026-09-30')
const genset=await api('/api/preventive/dashboard?date_from=2026-09-01&date_to=2026-09-30&maintenance_type=genset')
assert.ok(overview.rows.length>2124);assert.equal(genset.rows.length,383)
const sites=await api('/api/pm-site?date_from=2026-09-01&date_to=2026-09-30');assert.equal(sites.rows.length,2124)
const record=sites.rows.find(row=>row.site_id==='STB710')
const detail=await api(`/api/pm-site/detail?${new URLSearchParams({id:record.id})}`)
assert.equal(detail.pm.last_maintenance,'2026-08-20');assert.equal(detail.master.site_name,'SEILEPAN');assert.ok(detail.incidents.length)
const run=await api('/api/runs',{method:'POST'})
const raw=await fs.readFile('C:/Users/ASUS/Downloads/KPIData_SONL1_20269 (8).xlsx')
const form=new FormData();form.append('file',new Blob([raw]),'KPIData_SONL1_20269 (8).xlsx');form.append('upload_date','2026-09-17')
await api(`/api/runs/${run.id}/upload`,{method:'POST',body:form})
const kpi=await api(`/api/runs/${run.id}/dashboard`)
assert.ok(kpi.analysis||kpi.nops||kpi.table)
const history=await api('/api/history');assert.ok(history.items.some(item=>item.run_id===run.id))
const exportResponse=await fetch(`${base}/api/runs/${run.id}/export.xlsx`);assert.equal(exportResponse.status,200);assert.ok((await exportResponse.arrayBuffer()).byteLength>1000)
console.log(JSON.stringify({overview_work_orders:overview.rows.length,genset_work_orders:genset.rows.length,site_work_orders:sites.rows.length,kpi_run_id:run.id,kpi_upload:true,kpi_dashboard:true,kpi_history:true,kpi_export:true},null,2))
