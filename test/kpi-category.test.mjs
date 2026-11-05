import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {parseKpiCategoryExport} from '../server/services.js'

test('SOMSA L0 upload works without a SON L1 column and accepts the actual field name',async()=>{
  const workbook=new ExcelJS.Workbook()
  const sheet=workbook.addWorksheet('KPI Category')
  sheet.addRow(['NOP','Period','SOMSA L0 Score Category'])
  sheet.addRow(['BANDA ACEH','November / 2026','Baik'])
  const parsed=await parseKpiCategoryExport(await workbook.xlsx.writeBuffer())
  assert.equal(parsed.row_count,1)
  assert.deepEqual(parsed.periods,['2026-11'])
  assert.equal(parsed.rows[0].name,'NOP BANDA ACEH')
  assert.equal(parsed.rows[0].somsa_l0_category,'Baik')
  assert.equal(parsed.rows[0].son_l1_category,'')
})

test('legacy combined category upload remains backward compatible',async()=>{
  const workbook=new ExcelJS.Workbook()
  const sheet=workbook.addWorksheet('KPI Category')
  sheet.addRow(['NOP','Period','SONL 1 Score Category','SOMSAL 0 Score Category'])
  sheet.addRow(['MEDAN','Oct / 2026','Baik Sekali','Cukup'])
  const parsed=await parseKpiCategoryExport(await workbook.xlsx.writeBuffer())
  assert.equal(parsed.rows[0].son_l1_category,'Baik Sekali')
  assert.equal(parsed.rows[0].somsa_l0_category,'Cukup')
})
