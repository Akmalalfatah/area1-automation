import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {parseKpiCategoryExport} from '../server/services.js'
import {mergeKpiCategoryDatasets} from '../server/db.js'

const components=['1.1','1.2','1.3','1.4','1.5','1.6','1.7','1.8','2.1','2.2','2.3','3','4.1','4.2','5.1','5.2','6']
function rawSheet(){const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet('Sheet1');sheet.addRow(['Area','Regional','NOP','Month','Year','No','Group','Ruang Lingkup','Target','Bobot','Total','Pencapaian / Kejadian','Skor Pencapaian','Skor KPI']);return{workbook,sheet}}
function addNop(sheet,{name='NOP MEDAN',region='R01_Sumbagut',month=11,year=2026,score=85}={}){components.forEach((component,index)=>sheet.addRow(['Area1',region,name,month,year,component,'A. Activity Preventive Maintenance Asset & Variable Activity Site','Component',0,0,0,0,0,index?0:score]));}

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

test('raw SOMSA L0 accepts 17 component rows and derives period from Month/Year',async()=>{
  const {workbook,sheet}=rawSheet();addNop(sheet,{score:57.6671});addNop(sheet,{name:'NOP JAMBI',region:'R02_Sumbagsel',month:12,score:95});
  const parsed=await parseKpiCategoryExport(await workbook.xlsx.writeBuffer());assert.equal(parsed.row_count,2);assert.deepEqual(parsed.periods,['2026-11','2026-12']);
  assert.equal(parsed.rows[0].somsa_l0_score,57.6671);assert.equal(parsed.rows[0].somsa_l0_category,'Kurang');assert.equal(parsed.rows[0].son_l1_category,'');assert.equal(parsed.rows[1].somsa_l0_category,'Istimewa');
})
test('raw score categories use source totals across all five category boundaries',async()=>{
  for(const [score,expected] of [[0,'Kurang'],[79.9999,'Kurang'],[80,'Cukup'],[84.9999,'Cukup'],[85,'Baik'],[89.9999,'Baik'],[90,'Baik Sekali'],[94.9999,'Baik Sekali'],[95,'Istimewa'],[100,'Istimewa']]){
    const {workbook,sheet}=rawSheet();addNop(sheet,{score});const parsed=await parseKpiCategoryExport(await workbook.xlsx.writeBuffer());assert.equal(parsed.rows[0].somsa_l0_category,expected,`score ${score}`);
  }
})
test('raw files reject incomplete components, double-counting, blank scores and invalid periods',async()=>{
  for(const [mutate,message] of [[s=>s.spliceRows(18,1),/belum lengkap/],[s=>s.addRow(s.getRow(2).values),/berulang/],[s=>{s.getCell('N2').value=null},/Skor KPI.*tidak valid/],[s=>{s.getCell('D2').value=13},/Month\/Year/],[s=>{s.getCell('G2').value='B. Ticketing'},/bukan KPIData SON L1/],[s=>{s.getCell('B2').value='R02_Sumbagsel'},/Regional.*tidak sesuai/]]){
    const {workbook,sheet}=rawSheet();addNop(sheet);mutate(sheet);
    await assert.rejects(async()=>parseKpiCategoryExport(await workbook.xlsx.writeBuffer()),message);
  }
})
test('monthly SOMSA updates preserve older months and SON L1; repeating uploads does not duplicate NOPs',()=>{
  const prior={rows:[{name:'NOP MEDAN',region:'R01_Sumbagut',period:'2026-10',son_l1_category:'Baik',somsa_l0_category:'Cukup'},{name:'NOP MEDAN',region:'R01_Sumbagut',period:'2026-11',son_l1_category:'Baik Sekali',somsa_l0_category:'Cukup'}]};
  const fresh={rows:[{name:'NOP MEDAN',region:'R01_Sumbagut',period:'2026-11',son_l1_category:'',somsa_l0_category:'Kurang',somsa_l0_score:57.6671}]};
  const merged=mergeKpiCategoryDatasets(prior,fresh,fresh);assert.equal(merged.row_count,2);assert.deepEqual(merged.periods,['2026-10','2026-11']);assert.equal(merged.rows[0].somsa_l0_category,'Cukup');assert.equal(merged.rows[1].son_l1_category,'Baik Sekali');assert.equal(merged.rows[1].somsa_l0_category,'Kurang');
})
