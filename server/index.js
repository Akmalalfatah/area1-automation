import express from 'express'
import multer from 'multer'
import fs from 'node:fs/promises'
import {BOOK1_START_COLUMNS, NOP_ORDER, REGION_NOPS, ROW_DEFINITIONS} from './constants.js'
import {RUNS_DIR, SERVER_DIR, TEMPLATE_PATH, WEB_DIR} from './config.js'
import {databaseEnabled, deleteHistory, initDb, latestPreventiveUpload, listHistory, loadPreviousHistoryDataset, loadPreventiveRows, savePreventiveUpload} from './db.js'
import {buildAnalysis, createRun, dashboardPayload, generateReport, loadDataset, loadState, processRun, saveState, uploadAndProcess, ValidationError} from './services.js'
import {buildPreventiveDashboard, parsePreventiveWorkbook} from './preventive.js'
import {patchTemplate} from './export-xlsx.js'

const app=express(), upload=multer({storage:multer.memoryStorage(),limits:{fileSize:25*1024*1024}})
app.use(express.json({limit:'1mb'}))
app.use('/static',express.static(`${WEB_DIR}/static`))
app.get('/',(_req,res)=>res.sendFile(`${WEB_DIR}/index.html`))
app.get('/api/health',(_req,res)=>res.json({status:'ok',runtime:'node'}))
app.get('/api/config',(_req,res)=>res.json({regions:REGION_NOPS,default_prompt:'',database_enabled:databaseEnabled}))

app.post('/api/runs',asyncHandler(async(_req,res)=>res.json(await createRun(RUNS_DIR))))
app.get('/api/runs/:id',asyncHandler(async(req,res)=>{try{res.json(await loadState(RUNS_DIR,req.params.id))}catch(error){const dataset=await loadDataset(RUNS_DIR,req.params.id).catch(()=>null);if(!dataset)throw error;res.json({id:req.params.id,upload:null,processed:true,report:null,prompt:'',history:true})}}))
app.post('/api/runs/:id/upload',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);assertDate(req.body.upload_date);res.json(await uploadAndProcess(RUNS_DIR,req.params.id,req.file,req.body.upload_date))}))
app.post('/api/runs/:id/process',asyncHandler(async(req,res)=>{const dataset=await processRun(RUNS_DIR,req.params.id);res.json({ok:true,date:dataset.date})}))
app.get('/api/runs/:id/dashboard',asyncHandler(async(req,res)=>res.json(await dashboardPayload(RUNS_DIR,req.params.id,req.query.region||null,req.query.nop||null,req.query.category||null))))

app.post('/api/runs/:id/report',asyncHandler(async(req,res)=>{
  const {prompt,region=null,nop=null,category=null}=req.body||{};if(!String(prompt||'').trim())throw new HttpError(422,'Prompt wajib diisi.')
  const dataset=await loadDataset(RUNS_DIR,req.params.id),baseline=await loadPreviousHistoryDataset(req.params.id,dataset.date),analysis=buildAnalysis(dataset,region,nop,category,baseline),text=await generateReport(prompt,analysis)
  try{const state=await loadState(RUNS_DIR,req.params.id);state.prompt=prompt;state.report={text,region,nop,category};await saveState(RUNS_DIR,state)}catch{}
  res.json({text})
}))

app.get('/api/history',asyncHandler(async(req,res)=>res.json({items:await listHistory(req.query)})))
app.delete('/api/history',asyncHandler(async(req,res)=>{const ids=[...new Set((req.body?.run_ids||[]).filter(Boolean))];if(!ids.length)throw new HttpError(400,'Pilih minimal satu KPI history.');const deleted=await deleteHistory(ids);await Promise.all(ids.map(id=>fs.rm(`${RUNS_DIR}/${id}`,{recursive:true,force:true})));res.json({deleted})}))

app.post('/api/preventive/upload',upload.single('file'),asyncHandler(async(req,res)=>{assertXlsx(req.file);assertDate(req.body.upload_date);const dataset=await parsePreventiveWorkbook(req.file.buffer,req.file.originalname),uploadId=crypto.randomUUID(),replaced=await savePreventiveUpload(uploadId,req.body.upload_date,req.file.originalname,dataset);res.json({upload_id:uploadId,upload_date:req.body.upload_date,filename:req.file.originalname,row_count:dataset.row_count,data_month:dataset.data_month,date_start:dataset.date_start,date_end:dataset.date_end,replaced_upload_count:replaced})}))
app.get('/api/preventive/dashboard',asyncHandler(async(req,res)=>{const payload=buildPreventiveDashboard(await loadPreventiveRows(),req.query.date_from,req.query.date_to,req.query.nop,req.query.site_id,req.query.search);payload.latest_upload=await latestPreventiveUpload();res.json(payload)}))

app.get('/api/runs/:id/export.xlsx',asyncHandler(async(req,res)=>{
  const dataset=await loadDataset(RUNS_DIR,req.params.id),selected=dataset.nops.filter(item=>(!req.query.region||item.region===req.query.region)&&(!req.query.nop||item.name===req.query.nop)&&(!req.query.category||item.values.category===req.query.category)),names=new Set(selected.map(x=>x.name))
  const values={},strings={},dates={},hidden=new Set(),headers=[],date=new Date(`${dataset.date}T00:00:00Z`)
  for(const nop of NOP_ORDER){const col=BOOK1_START_COLUMNS[nop];hidden.add(col+1);hidden.add(col+2);if(!names.has(nop))hidden.add(col)}
  for(const item of selected){const column=numberToColumn(BOOK1_START_COLUMNS[item.name]);dates[`${column}3`]=date;for(const row of ROW_DEFINITIONS){const ref=`${column}${row.book1_row}`;if(row.type==='category')strings[ref]=item.values[row.key]||'';else values[ref]=item.values[row.key]}}
  for(const [region,nops] of Object.entries(REGION_NOPS)){const visible=nops.filter(x=>names.has(x));if(visible.length)headers.push([region,numberToColumn(BOOK1_START_COLUMNS[visible[0]]),numberToColumn(BOOK1_START_COLUMNS[visible.at(-1)])])}
  const filter=String(req.query.nop||req.query.region||req.query.category||'all-nop').toLowerCase().replace(/_/g,' ').trim().replace(/\s+/g,'-'),filename=`kpi-${dataset.date}-${filter}.xlsx`,buffer=await patchTemplate({templatePath:TEMPLATE_PATH,values,strings,dates,hiddenColumns:hidden,regionHeaders:headers});res.set({'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':`attachment; filename="${filename}"`});res.send(buffer)
}))

class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
function assertXlsx(file){if(!file||!file.originalname?.toLowerCase().endsWith('.xlsx'))throw new HttpError(400,'File harus berformat .xlsx')}
function assertDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))||Number.isNaN(Date.parse(`${value}T00:00:00Z`)))throw new HttpError(400,'Tanggal upload tidak valid.')}
function asyncHandler(fn){return(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
function numberToColumn(number){let result='';while(number){number--;result=String.fromCharCode(65+number%26)+result;number=Math.floor(number/26)}return result}
app.use((error,_req,res,_next)=>{console.error(error);const status=error.status||(error instanceof ValidationError?422:/belum dikonfigurasi|Database|Gemini|connect|fetch/i.test(error.message)?503:500);res.status(status).json({detail:error.message||'Terjadi kesalahan pada server.'})})

void fs.mkdir(RUNS_DIR,{recursive:true})
  .then(()=>initDb(SERVER_DIR))
  .catch(error=>console.warn(`Database startup dilewati: ${error.message}`))

export default app
