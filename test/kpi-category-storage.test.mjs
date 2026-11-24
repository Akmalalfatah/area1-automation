import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'somsa-category-test-'));
process.env.USE_DATABASE='false';process.env.APP_DATA_DIR=directory;
const {saveKpiCategoryExport,loadKpiCategoryExport}=await import('../server/db.js');
after(async()=>{if(path.basename(directory).startsWith('somsa-category-test-'))await fs.rm(directory,{recursive:true,force:true});});
const record=(period,category,son='')=>({name:'NOP MEDAN',region:'R01_Sumbagut',period,son_l1_category:son,somsa_l0_category:category});
const dataset=rows=>({kind:'kpi_category_export',rows,row_count:rows.length,periods:[...new Set(rows.map(r=>r.period))]});
test('saving a partial month retains bundled history and prior SON L1 through reload',async()=>{
  await fs.writeFile(path.join(directory,'kpi-category-default.json'),JSON.stringify({dataset:dataset([record('2026-01','Baik'),record('2026-11','Cukup','Baik Sekali')])}));
  const result=await saveKpiCategoryExport('KPIData_SOMSAL0_202611.xlsx','2026-11-24',dataset([record('2026-11','Kurang')]));assert.equal(result.row_count,1);assert.equal(result.period_count,1);
  let saved=await loadKpiCategoryExport();assert.equal(saved.dataset.row_count,2);assert.equal(saved.dataset.rows[0].period,'2026-01');assert.equal(saved.dataset.rows[1].somsa_l0_category,'Kurang');assert.equal(saved.dataset.rows[1].son_l1_category,'Baik Sekali');
  await saveKpiCategoryExport('Repeat.xlsx','2026-11-24',dataset([record('2026-11','Kurang')]));saved=await loadKpiCategoryExport();assert.equal(saved.dataset.row_count,2);
});
test('concurrent uploads for different months retain both updates',async()=>{
  await Promise.all([saveKpiCategoryExport('February.xlsx','2026-11-24',dataset([record('2026-02','Cukup')])),saveKpiCategoryExport('March.xlsx','2026-11-24',dataset([record('2026-03','Baik')]))]);
  const saved=await loadKpiCategoryExport();assert.deepEqual(saved.dataset.periods,['2026-01','2026-02','2026-03','2026-11']);
});
