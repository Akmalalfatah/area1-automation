import {enrichDashboardReview} from './dashboard-review.js'
import {enrichWorkConditions} from './work-condition.js'
import {freshnessTypes,buildFreshness} from './data-freshness.js'
import express from 'express'
import multer from 'multer'
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import {BOOK1_START_COLUMNS, DEFAULT_REPORT_PROMPT, NOP_ORDER, REGION_NOPS, ROW_DEFINITIONS} from './constants.js'
import {RUNS_DIR, SERVER_DIR, TEMPLATE_PATH, WEB_DIR} from './config.js'
import {databaseEnabled, deleteHistory, initDb, latestPreventiveUpload, listHistory, loadPreviousHistoryDataset, loadPreventiveRows, savePreventiveUpload} from './db.js'
import {buildAnalysis, buildMttrMetrics, createRun, dashboardPayload, generateReport, loadDataset, loadState, MTTR_TARGETS_BY_COMPONENT, processRun, saveState, uploadAndProcess, uploadTicketMttrSummary, ValidationError} from './services.js'
import {buildPreventiveDashboard, parsePreventiveWorkbook} from './preventive.js'
import {patchTemplate} from './export-xlsx.js'
import {siteData,siteDataForUploadMonth,listSites,listPunchlistSites,savePunchlistNote,analyzeSite,parseSiteSource,saveSiteSource,saveEvaluation} from './pm-site.js'
import {workOrderKey} from './preventive.js'
import {gensetData,analyzeGenset,saveGensetEvaluation,enrichGensetSource} from './pm-genset.js'
import {preventiveUploadHistory,applicationUploadHistory} from './db.js'
import {buildKpiB13Summaries,parseKpiB13} from './kpi-b13.js'

const app=express(), upload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024}})
app.use(express.json({limit:'1mb'}))
app.use('/static',express.static(`${WEB_DIR}/static`))
app.get('/',(_req,res)=>res.sendFile(`${WEB_DIR}/index.html`))
app.get('/api/health',(_req,res)=>res.json({status:'ok',runtime:'node'}))
app.get('/api/config',(_req,res)=>res.json({regions:REGION_NOPS,default_prompt:DEFAULT_REPORT_PROMPT,database_enabled:databaseEnabled}))

app.post('/api/runs',asyncHandler(async(_req,res)=>res.json(await createRun(RUNS_DIR))))
app.get('/api/runs/:id',asyncHandler(async(req,res)=>{try{res.json(await loadState(RUNS_DIR,req.params.id))}catch(error){const dataset=await loadDataset(RUNS_DIR,req.params.id).catch(()=>null);if(!dataset)throw error;res.json({id:req.params.id,upload:null,processed:true,report:null,prompt:'',history:true})}}))
app.post('/api/runs/:id/upload',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);assertDate(req.body.upload_date);res.json(await uploadAndProcess(RUNS_DIR,req.params.id,req.file,req.body.upload_date,req.body.reporting_type))}))
app.post('/api/runs/:id/ticket-summary',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);if(!String(req.body.nop||'').trim())throw new HttpError(422,'Pilih NOP untuk Ticket Summary.');res.json(await uploadTicketMttrSummary(RUNS_DIR,req.params.id,req.file,req.body.nop))}))
app.post('/api/runs/:id/process',asyncHandler(async(req,res)=>{const dataset=await processRun(RUNS_DIR,req.params.id);res.json({ok:true,date:dataset.date})}))
app.get('/api/runs/:id/dashboard',asyncHandler(async(req,res)=>{
  const payload=await dashboardPayload(RUNS_DIR,req.params.id,req.query.region||null,req.query.nop||null,req.query.category||null)
  const derived=deriveTicketMttrByNop(await siteData(),payload.dataset.nops.map(item=>item.name),payload.dataset.reporting_period?.source_period||String(payload.dataset.date||'').slice(0,7))
  payload.dataset.ticket_summaries={...(payload.dataset.ticket_summaries||{}),...derived}
  res.json(payload)
}))
app.get('/api/runs/:id/mttr-boosting',asyncHandler(async(req,res)=>{
  const dataset=await loadDataset(RUNS_DIR,req.params.id),period=boostingPeriod(req.query,dataset.date),sourceSnapshot=await siteDataForUploadMonth(period),data=sourceSnapshot.data
  const selected=dataset.nops.filter(item=>(!req.query.region||item.region===req.query.region)&&(!req.query.nop||item.name===req.query.nop)),names=selected.map(item=>item.name)
  const b13Rows=combinedKpiB13Rows(data),swfmSummaries=deriveTicketMttrByNop(data,names,period),kpiSummaries=buildKpiB13Summaries(b13Rows,names,period)
  const ticket_summaries=mergeTicketSummaries(names,swfmSummaries,kpiSummaries,period)
  const available_periods=[...new Set([...sourceSnapshot.available_periods,...(data.swfm||[]).map(row=>String(row.occurred_at||'').slice(0,7)),...b13Rows.map(row=>row.period)].filter(value=>/^\d{4}-\d{2}$/.test(value)))].sort().reverse()
  res.json({period,available_periods,ticket_summaries:withoutSimulationRows(ticket_summaries),debug:buildBoostingDebug(ticket_summaries),source:sourceSnapshot.historical?'Snapshot upload pada bulan terpilih: KPIData B.1-B.3 dengan fallback Ticket SWFM':'KPIData B.1-B.3 dengan fallback Ticket SWFM'})
}))

app.post('/api/runs/:id/report',asyncHandler(async(req,res)=>{
  const {prompt,region=null,nop=null,category=null}=req.body||{};if(!String(prompt||'').trim())throw new HttpError(422,'Prompt wajib diisi.')
  const dataset=await loadDataset(RUNS_DIR,req.params.id),baseline=await loadPreviousHistoryDataset(req.params.id,dataset.date),analysis=buildAnalysis(dataset,region,nop,category,baseline),text=await generateReport(prompt,analysis)
  try{const state=await loadState(RUNS_DIR,req.params.id);state.prompt=prompt;state.report={text,region,nop,category};await saveState(RUNS_DIR,state)}catch{}
  res.json({text})
}))

app.get('/api/history',asyncHandler(async(req,res)=>res.json({items:await listHistory(req.query)})))
app.get('/api/uploads',asyncHandler(async(req,res)=>res.json({items:await applicationUploadHistory(req.query.page)})))
app.get('/api/master-site/upload',asyncHandler(async(_req,res)=>{const data=await siteData();res.json({latest_upload:(data.sources||[]).find(source=>source.source_kind==='master')||null})}))
app.get('/api/data-freshness',asyncHandler(async(_req,res)=>{const pairs=await Promise.all(freshnessTypes.map(async([key])=>[key,(await applicationUploadHistory(key))[0]||null]));const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());res.json({today,items:buildFreshness(Object.fromEntries(pairs),today)})}))
app.delete('/api/history',asyncHandler(async(req,res)=>{const ids=[...new Set((req.body?.run_ids||[]).filter(Boolean))];if(!ids.length)throw new HttpError(400,'Pilih minimal satu KPI history.');const deleted=await deleteHistory(ids);await Promise.all(ids.map(id=>fs.rm(`${RUNS_DIR}/${id}`,{recursive:true,force:true})));res.json({deleted})}))

app.post('/api/preventive/upload',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);assertDate(req.body.upload_date);const dataset=await parsePreventiveWorkbook(req.file.buffer,req.file.originalname);const page=req.body.upload_page||dataset.maintenance_kind;if(!['dashboard','genset','site'].includes(page))throw new HttpError(422,'Halaman upload tidak valid.');if(page!=='dashboard'&&page!==dataset.maintenance_kind)throw new HttpError(422,'Jenis file tidak sesuai halaman PM.');dataset.upload_page=page;const uploadId=crypto.randomUUID(),replaced=await savePreventiveUpload(uploadId,req.body.upload_date,req.file.originalname,dataset);res.json({upload_id:uploadId,upload_date:req.body.upload_date,filename:req.file.originalname,row_count:dataset.row_count,data_month:dataset.data_month,date_start:dataset.date_start,date_end:dataset.date_end,replaced_upload_count:replaced})}))
app.get('/api/preventive/uploads',asyncHandler(async(req,res)=>res.json({items:await preventiveUploadHistory(req.query.page||'dashboard')})))
app.get('/api/preventive/dashboard',asyncHandler(async(req,res)=>{const payload=buildPreventiveDashboard(await loadPreventiveRows(),req.query.date_from,req.query.date_to,req.query.nop,req.query.site_id,req.query.search,req.query.maintenance_type,req.query.status,req.query.pic,req.query.interval,req.query.type_power,req.query.scope_item,req.query.schedule_state);const source=await siteData();payload.rows=enrichWorkConditions(enrichDashboardReview(payload.rows,source),source);payload.latest_upload=(await preventiveUploadHistory(req.query.maintenance_type||'dashboard',true))[0]||null;res.json(payload)}))

app.get('/api/pm-genset/detail',asyncHandler(async(req,res)=>{const data=await gensetData(),pm=data.pm?.findLast(row=>row.maintenance_kind==='genset'&&workOrderKey(row)===req.query.id);if(!pm)throw new HttpError(404,'Pekerjaan PM Genset tidak ditemukan.');res.json(analyzeGenset(pm,data,req.query.window_days?{windowDays:Number(req.query.window_days)}:{}))}))
app.put('/api/pm-genset/evaluation',asyncHandler(async(req,res)=>{const data=await gensetData(),pm=data.pm?.findLast(row=>row.maintenance_kind==='genset'&&workOrderKey(row)===req.body.id);if(!pm)throw new HttpError(404,'Pekerjaan PM Genset tidak ditemukan.');res.json(await saveGensetEvaluation(pm,req.body))}))

app.get('/api/pm-site',asyncHandler(async(req,res)=>res.json(listSites(await siteData(),req.query))))
app.get('/api/punchlist',asyncHandler(async(req,res)=>res.json(await listPunchlistSites(await siteData(),req.query))))
app.put('/api/punchlist/:siteId',asyncHandler(async(req,res)=>res.json(await savePunchlistNote(req.params.siteId,req.body))))
app.post('/api/pm-site/sources/:kind',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);assertDate(req.body.upload_date);const kinds=['master','ggr','inap','swfm','kpi_b13_r01','kpi_b13_r02','kpi_b13_r10'];if(!kinds.includes(req.params.kind))throw new HttpError(422,'Jenis sumber upload tidak valid.');const regionByKind={kpi_b13_r01:'R01_Sumbagut',kpi_b13_r02:'R02_Sumbagsel',kpi_b13_r10:'R10_Sumbagteng'},region=regionByKind[req.params.kind];const dataset=region?await parseKpiB13(req.file.buffer,region):await enrichGensetSource(req.file.buffer,req.params.kind,await parseSiteSource(req.file.buffer,req.params.kind));res.json(await saveSiteSource(req.params.kind,req.file.originalname,req.body.upload_date,dataset))}))
app.get('/api/pm-site/detail',asyncHandler(async(req,res)=>{const data=await siteData(),pm=data.pm?.find(row=>row.maintenance_kind==='site'&&workOrderKey(row)===req.query.id);if(!pm)throw new HttpError(404,'Pekerjaan PM Site tidak ditemukan.');res.json(analyzeSite(pm,data))}))
app.put('/api/pm-site/evaluation',asyncHandler(async(req,res)=>{const data=await siteData(),pm=data.pm?.find(row=>row.maintenance_kind==='site'&&workOrderKey(row)===req.body.id);if(!pm)throw new HttpError(404,'Pekerjaan PM Site tidak ditemukan.');res.json(await saveEvaluation(pm,req.body))}))

app.get('/api/runs/:id/export.xlsx',asyncHandler(async(req,res)=>{
  const dataset=await loadDataset(RUNS_DIR,req.params.id),selected=dataset.nops.filter(item=>(!req.query.region||item.region===req.query.region)&&(!req.query.nop||item.name===req.query.nop)&&(!req.query.category||item.values.category===req.query.category)),names=new Set(selected.map(x=>x.name))
  const values={},strings={},dates={},hidden=new Set(),headers=[],date=new Date(`${dataset.date}T00:00:00Z`)
  for(const nop of NOP_ORDER){const col=BOOK1_START_COLUMNS[nop];hidden.add(col+1);hidden.add(col+2);if(!names.has(nop))hidden.add(col)}
  for(const item of selected){const column=numberToColumn(BOOK1_START_COLUMNS[item.name]);dates[`${column}3`]=date;for(const row of ROW_DEFINITIONS){const ref=`${column}${row.book1_row}`;if(row.type==='category')strings[ref]=item.values[row.key]||'';else values[ref]=item.values[row.key]}}
  for(const [region,nops] of Object.entries(REGION_NOPS)){const visible=nops.filter(x=>names.has(x));if(visible.length)headers.push([region,numberToColumn(BOOK1_START_COLUMNS[visible[0]]),numberToColumn(BOOK1_START_COLUMNS[visible.at(-1)])])}
  const filter=String(req.query.nop||req.query.region||req.query.category||'all-nop').toLowerCase().replace(/_/g,' ').trim().replace(/\s+/g,'-'),filename=`kpi-${dataset.date}-${filter}.xlsx`,buffer=await patchTemplate({templatePath:TEMPLATE_PATH,values,strings,dates,hiddenColumns:hidden,regionHeaders:headers});res.set({'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':`attachment; filename="${filename}"`});res.send(buffer)
}))

app.get('/api/runs/:id/mttr-boosting/export.xlsx',asyncHandler(async(req,res)=>{
  const dataset=await loadDataset(RUNS_DIR,req.params.id),period=boostingPeriod(req.query,dataset.date),sourceSnapshot=await siteDataForUploadMonth(period),data=sourceSnapshot.data
  const selected=dataset.nops.filter(item=>(!req.query.region||item.region===req.query.region)&&(!req.query.nop||item.name===req.query.nop)),names=selected.map(item=>item.name)
  const b13Rows=combinedKpiB13Rows(data),summaries=mergeTicketSummaries(names,deriveTicketMttrByNop(data,names,period),buildKpiB13Summaries(b13Rows,names,period),period)
  const workbook=buildBoostingWorkbook(dataset,selected,summaries,{period,region:req.query.region||'',nop:req.query.nop||''}),buffer=await workbook.xlsx.writeBuffer()
  const scope=String(req.query.nop||req.query.region||'semua-nop').replace(/[^A-Za-z0-9_-]+/g,'-')
  res.set({'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':`attachment; filename="Peningkatan-KPI-B-${period}-${scope}.xlsx"`});res.send(Buffer.from(buffer))
}))

class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
function assertXlsx(file){if(!file||!file.originalname?.toLowerCase().endsWith('.xlsx'))throw new HttpError(400,'File harus berformat .xlsx')}
function assertDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))||Number.isNaN(Date.parse(`${value}T00:00:00Z`)))throw new HttpError(400,'Tanggal upload tidak valid.')}
function boostingPeriod(query,fallbackDate){
  const year=String(query.year||String(fallbackDate||'').slice(0,4)).trim(),month=String(query.month||String(fallbackDate||'').slice(5,7)).trim().padStart(2,'0'),period=`${year}-${month}`
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw new HttpError(400,'Bulan Peningkatan KPI harus berformat YYYY-MM.')
  return period
}
function asyncHandler(fn){return(req,res,next)=>databaseReady.then(()=>fn(req,res,next)).catch(next)}
function numberToColumn(number){let result='';while(number){number--;result=String.fromCharCode(65+number%26)+result;number=Math.floor(number/26)}return result}
export function deriveTicketMttrByNop(data,nopNames,period){
  const canonical=new Map(nopNames.map(name=>[normalizeNopKey(name),name])),siteNop=new Map((data.master||[]).map(row=>[String(row.site_id||'').trim().toUpperCase(),row.nop]))
  const componentKeys=['B_1','B_2.1','B_2.2','B_2.3','B_3']
  const blank=()=>Object.fromEntries(componentKeys.map(component=>[component,Object.fromEntries(Object.keys(MTTR_TARGETS_BY_COMPONENT[component]).map(severity=>[severity,[]]))]))
  const buckets=new Map(),seen=new Set()
  for(const row of data.swfm||[]){
    const excluded=String(row.excluded||'').trim().toUpperCase();if(excluded!=='NO')continue
    if(String(row.occurred_at||'').slice(0,7)!==period)continue
    const ticket=String(row.ticket_no||'').trim(),site=String(row.site_id||'').trim().toUpperCase(),identity=ticket.toUpperCase();if(!ticket||seen.has(identity))continue
    const nop=canonical.get(normalizeNopKey(row.nop||siteNop.get(site)));if(!nop)continue
    const severity=normalizeTicketSeverity(row.severity);if(!severity)continue
    const start=Date.parse(row.occurred_at||''),end=Date.parse(row.site_cleared_at||row.closed_at||'')
    let minutes=Number.isFinite(start)&&Number.isFinite(end)&&end>=start?(end-start)/60000:NaN
    if(!Number.isFinite(minutes)||minutes<0)minutes=row.duration_minutes===null||row.duration_minutes===undefined||row.duration_minutes===''?NaN:Number(row.duration_minutes)
    if(!Number.isFinite(minutes)||minutes<0)continue
    seen.add(identity)
    if(!buckets.has(nop))buckets.set(nop,blank())
    const item={mttr_hours:minutes/60,ticket_number:ticket,inap_no:String(row.parent_ticket||'').trim(),site:row.site_id||'',site_name:row.site_name||'',nop,severity,fault_level:row.fault_level||'',root_cause_category:row.rc_category||'',root_cause_1:row.rc1||'',root_cause_2:row.rc2||'',pic:row.pic||'',source_row:row.source_row}
    for(const component of ticketComponents(row)){const bucket=buckets.get(nop)[component][severity];if(bucket)bucket.push(item)}
  }
  return Object.fromEntries([...buckets].map(([nop,components])=>{
    const componentMetrics=Object.fromEntries(componentKeys.map(component=>[component,buildMttrMetrics(components[component],MTTR_TARGETS_BY_COMPONENT[component])]))
    const metrics=componentMetrics.B_1
    const source_rows=Object.values(components).flatMap(Object.values).reduce((sum,items)=>sum+items.length,0)
    return [nop,{nop,metrics,components:componentMetrics,source:'Ticket SWFM',source_rows,period}]
  }))
}
export function mergeTicketSummaries(nopNames,swfmSummaries,kpiSummaries,period){
  const result={}
  for(const nop of nopNames){
    const swfm=swfmSummaries[nop],kpi=kpiSummaries[nop]
    if(!swfm&&!kpi)continue
    const components={}
    const component_sources={}
    for(const [code,targets] of Object.entries(MTTR_TARGETS_BY_COMPONENT)){
      const kpiMetrics=kpi?.components?.[code]||[],swfmMetrics=swfm?.components?.[code]||[]
      // Source priority berlaku untuk satu komponen secara utuh. Jika KPIData
      // memiliki ticket pada B.x, seluruh severity B.x berasal dari KPIData;
      // SWFM hanya dipakai bila komponen KPIData tersebut benar-benar kosong.
      const source=kpiMetrics.some(item=>Number(item.tickets)>0)?'KPIData B.1-B.3':swfmMetrics.some(item=>Number(item.tickets)>0)?'Ticket SWFM fallback':'Tidak Ada Data'
      const metrics=source==='KPIData B.1-B.3'?kpiMetrics:source==='Ticket SWFM fallback'?swfmMetrics:buildMttrMetrics({},targets)
      component_sources[code]=source
      components[code]=metrics.map(item=>({...item,source}))
    }
    const source_rows=Object.values(components).flat().reduce((sum,item)=>sum+Number(item.tickets||0),0)
    result[nop]={nop,components,component_sources,metrics:components.B_1,source:'KPIData B.1-B.3 (primary), Ticket SWFM (fallback)',source_rows,period}
  }
  return result
}
function buildBoostingDebug(summaries){
  return Object.values(summaries).flatMap(summary=>Object.entries(summary.components||{}).flatMap(([component,metrics])=>metrics.map(metric=>({
    nop:summary.nop,period:summary.period,component,source:metric.source||summary.component_sources?.[component]||'Tidak Ada Data',severity:metric.severity,totalTickets:Number(metric.tickets)||0,currentP90:metric.currentP90,target:metric.target,ticketNeeded:metric.ticketNeeded,projectedP90:metric.projectedP90
  }))))
}
function withoutSimulationRows(summaries){
  return Object.fromEntries(Object.entries(summaries).map(([nop,summary])=>[nop,{...summary,components:Object.fromEntries(Object.entries(summary.components||{}).map(([component,metrics])=>[component,metrics.map(({candidates,candidateTickets,...metric})=>metric)]))}]))
}
function normalizeNopKey(value){return String(value||'').toUpperCase().replace(/^NOP\s+/,'').replace(/[^A-Z0-9]/g,'')}
function combinedKpiB13Rows(data){
  const sources=['kpi_b13_r01','kpi_b13_r02','kpi_b13_r10','kpi_b13'],seen=new Set(),rows=[]
  for(const source of sources)for(const row of data[source]||[]){const identity=[row.nop,row.component,row.severity,row.ticket_number,row.source_row,row.period].join('|');if(seen.has(identity))continue;seen.add(identity);rows.push(row)}
  return rows
}
function buildBoostingWorkbook(dataset,selected,summaries,filter){
  const labels={B_1:'Restoration Impact Service Incident Alarm','B_2.1':'Restoration Potential Impact Service Non Incident Alarm Enva','B_2.2':'Restoration Impact Service Non Incident Alarm Controller','B_2.3':'Restoration Impact Service Non Incident Alarm Impact Service Alarm',B_3:'Restoration Impact Service Degraded Service (P2 & P3) & Others Alarm'}
  const weights=Object.fromEntries((dataset.rows||[]).map(row=>[row.key,Number(row.weight)||0])),book=new ExcelJS.Workbook(),summary=book.addWorksheet('Ringkasan Capture',{views:[{state:'frozen',ySplit:5}]}),sheet=book.addWorksheet('Detail MTTR',{views:[{state:'frozen',ySplit:5}]})
  summary.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.4,bottom:.4,header:.15,footer:.15}}
  summary.mergeCells('A1:H1');summary.getCell('A1').value='RINGKASAN PENINGKATAN KPI B.1 - B.3';summary.getCell('A1').font={name:'Arial',size:16,bold:true,color:{argb:'FFFFFFFF'}};summary.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173E68'}};summary.getCell('A1').alignment={horizontal:'center',vertical:'middle'};summary.getRow(1).height=30
  summary.mergeCells('A2:H2');summary.getCell('A2').value=`Periode ${filter.period} | Regional ${filter.region||'Semua Regional'} | NOP ${filter.nop||'Semua NOP'}`;summary.getCell('A2').font={name:'Arial',size:10,bold:true,color:{argb:'FF42536A'}};summary.getCell('A2').alignment={horizontal:'center'}
  summary.mergeCells('A3:H3');summary.getCell('A3').value='Ticket menuju 100% adalah total estimasi ticket prioritas agar seluruh severity yang terdeteksi mencapai target MTTR P90. Hasil ini mendukung pencapaian bobot maksimal, tetapi bukan konversi langsung ticket menjadi poin.';summary.getCell('A3').font={name:'Arial',size:9,italic:true,color:{argb:'FF64758A'}};summary.getCell('A3').alignment={wrapText:true,vertical:'middle'};summary.getRow(3).height=31
  summary.addRow([]);const summaryHeader=summary.addRow(['Regional','NOP','Point B','Nama Point KPI','Point Saat Ini','Bobot Maksimal (100%)','Ticket Menuju 100%','Penjelasan'])
  summaryHeader.height=31;summaryHeader.eachCell(cell=>{cell.font={name:'Arial',size:9,bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF294D78'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border={top:{style:'thin',color:{argb:'FF102C4D'}},left:{style:'thin',color:{argb:'FF102C4D'}},bottom:{style:'thin',color:{argb:'FF102C4D'}},right:{style:'thin',color:{argb:'FF102C4D'}}}})
  sheet.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.4,bottom:.4,header:.15,footer:.15}}
  sheet.mergeCells('A1:L1');sheet.getCell('A1').value='EVALUASI KPI TICKETING ACTIVITY & ALARM HANDLING B.1 - B.3';sheet.getCell('A1').font={name:'Arial',size:16,bold:true,color:{argb:'FFFFFFFF'}};sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173E68'}};sheet.getCell('A1').alignment={horizontal:'center',vertical:'middle'};sheet.getRow(1).height=30
  sheet.mergeCells('A2:L2');sheet.getCell('A2').value=`Periode ${filter.period} | Regional ${filter.region||'Semua Regional'} | NOP ${filter.nop||'Semua NOP'}`;sheet.getCell('A2').font={name:'Arial',size:10,bold:true,color:{argb:'FF42536A'}};sheet.getCell('A2').alignment={horizontal:'center'}
  sheet.mergeCells('A3:L3');sheet.getCell('A3').value='Ticket menuju 100% adalah estimasi ticket prioritas yang perlu diperbaiki agar MTTR P90 mencapai target severity. Nilai ini mendukung pencapaian bobot maksimal komponen, tetapi bukan konversi langsung satu ticket menjadi satu poin.';sheet.getCell('A3').font={name:'Arial',size:9,italic:true,color:{argb:'FF64758A'}};sheet.getCell('A3').alignment={wrapText:true,vertical:'middle'};sheet.getRow(3).height=31
  const headers=['Regional','NOP','Point B','Nama Point KPI','Bobot Maksimal','Point Saat Ini','Gap ke 100%','Severity','MTTR P90 Saat Ini','Target MTTR P90','Ticket Menuju 100%','Penjelasan']
  sheet.addRow([]);const header=sheet.addRow(headers);header.height=31
  header.eachCell(cell=>{cell.font={name:'Arial',size:9,bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF294D78'}};cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};cell.border={top:{style:'thin',color:{argb:'FF102C4D'}},left:{style:'thin',color:{argb:'FF102C4D'}},bottom:{style:'thin',color:{argb:'FF102C4D'}},right:{style:'thin',color:{argb:'FF102C4D'}}}})
  for(const item of selected)for(const code of Object.keys(MTTR_TARGETS_BY_COMPONENT)){
    const metrics=summaries[item.name]?.components?.[code]||[],weight=weights[code]||0,current=Number(item.values?.[code]),gap=Number.isFinite(current)?Math.max(0,weight-current):null
    const detected=metrics.filter(metric=>Number(metric.tickets)>0),totalNeeded=detected.reduce((sum,metric)=>sum+(Number(metric.needed)||0),0),needDetail=detected.filter(metric=>Number(metric.needed)>0).map(metric=>`${metric.severity}: ${metric.needed} ticket`).join('; '),summaryExplanation=!detected.length?'Belum ada ticket yang terdeteksi pada periode ini.':totalNeeded?`Prioritas per severity: ${needDetail}. Target operasionalnya adalah MTTR P90 setiap severity mencapai batas yang ditetapkan.`:'Seluruh severity yang terdeteksi sudah mencapai target MTTR P90; tidak membutuhkan ticket tambahan.'
    summary.addRow([item.region,item.name,code.replace('_','.'),labels[code],Number.isFinite(current)?current:null,weight,totalNeeded,summaryExplanation])
    for(const metric of metrics){const tickets=Number(metric.tickets)||0,needed=tickets?Number(metric.needed)||0:null,currentP90=Number(metric.achievement),target=Number(metric.target),projected=Number(metric.simulated);const explanation=!tickets?'Tidak ada ticket terdeteksi untuk severity dan periode ini.':needed===0?`MTTR P90 ${formatExportNumber(currentP90)} jam sudah memenuhi target ${formatExportNumber(target)} jam; tidak membutuhkan ticket tambahan.`:`Prioritaskan ${needed} ticket dengan MTTR tertinggi. Estimasi P90 turun dari ${formatExportNumber(currentP90)} menjadi ${formatExportNumber(projected)} jam untuk mencapai target ${formatExportNumber(target)} jam.`;sheet.addRow([item.region,item.name,code.replace('_','.'),labels[code],weight,Number.isFinite(current)?current:null,gap,metric.severity,Number.isFinite(currentP90)?currentP90:null,target,needed,explanation])}
  }
  summary.columns=[{width:18},{width:23},{width:10},{width:52},{width:16},{width:19},{width:20},{width:72}];summary.autoFilter={from:{row:5,column:1},to:{row:5,column:8}}
  for(let row=6;row<=summary.rowCount;row++){const record=summary.getRow(row);record.height=36;record.eachCell((cell,column)=>{cell.font={name:'Arial',size:9,bold:[1,2,3,5,7].includes(column)};cell.alignment={vertical:'middle',horizontal:[5,6,7].includes(column)?'center':'left',wrapText:[4,8].includes(column)};cell.border={bottom:{style:'thin',color:{argb:'FFD7DFE8'}},right:{style:'thin',color:{argb:'FFD7DFE8'}}};if(row%2===0)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F8FB'}}});for(const column of [5,6])record.getCell(column).numFmt='0.00'}
  sheet.columns=[{width:18},{width:23},{width:10},{width:54},{width:16},{width:15},{width:15},{width:13},{width:19},{width:18},{width:20},{width:72}]
  sheet.autoFilter={from:{row:5,column:1},to:{row:5,column:12}}
  for(let row=6;row<=sheet.rowCount;row++){const record=sheet.getRow(row);record.height=34;record.eachCell((cell,column)=>{cell.font={name:'Arial',size:9,bold:[1,2,3,6,11].includes(column)};cell.alignment={vertical:'middle',horizontal:[5,6,7,9,10,11].includes(column)?'center':'left',wrapText:[4,12].includes(column)};cell.border={bottom:{style:'thin',color:{argb:'FFD7DFE8'}},right:{style:'thin',color:{argb:'FFD7DFE8'}}};if(row%2===0)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F8FB'}}});for(const column of [5,6,7,9,10])record.getCell(column).numFmt='0.00'}
  return book
}
function formatExportNumber(value){return Number.isFinite(Number(value))?Number(value).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}):'-'}
function normalizeTicketSeverity(value){
  const severity=String(value||'').trim().toUpperCase().replace(/[\s_-]+/g,' ')
  if(severity==='HIGH')return 'MAJOR'
  if(severity==='MEDIUM')return 'MINOR'
  return ['CRITICAL','MAJOR','MINOR','LOW','VERY LOW'].includes(severity)?severity:null
}
export function ticketComponents(row){
  const type=String(row.ticket_type||'').trim().toUpperCase(),fault=String(row.fault_level||'').trim().toUpperCase().replace(/\s+/g,' ')
  if(type.includes('INCIDENT'))return ['B_1']
  if(!type.includes('EVENT'))return []
  if(fault.includes('ENVA'))return ['B_2.1']
  if(fault.includes('CONTROLLER')&&/\bP[12]\b/.test(fault))return ['B_2.2']
  if(/\bP2\b|\bP3\b/.test(fault)||['L2 CONFIGURATION','L2 LICENSE','VANDALISM'].includes(fault))return ['B_3']
  if(/\bP1\b/.test(fault))return ['B_2.3']
  return []
}
app.use((error,_req,res,_next)=>{console.error(error);const status=error.status||(error instanceof ValidationError?422:/belum dikonfigurasi|Database|Gemini|connect|fetch/i.test(error.message)?503:500);res.status(status).json({detail:error.message||'Terjadi kesalahan pada server.'})})

const databaseReady=fs.mkdir(RUNS_DIR,{recursive:true})
  .then(()=>initDb(SERVER_DIR))
databaseReady.catch(error=>console.warn(`Database startup gagal: ${error.message}`))

export default app
