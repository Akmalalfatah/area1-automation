import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import {NOP_ORDER, NOP_TO_REGION, REGION_NOPS, ROW_DEFINITIONS, SOURCE_ROWS} from './constants.js'
import {loadHistoryDataset, loadPreviousHistoryDataset, saveHistory} from './db.js'

export class ValidationError extends Error {}

const valueOf = value => value && typeof value === 'object' && 'result' in value ? value.result : value
const normalizeNop = value => String(value ?? '').trim().replace(/\s+/g,' ').toUpperCase()
const sourceKey = (group, number) => {
  const prefix = String(group ?? '').trim().toUpperCase()
  const suffix = Number.isInteger(Number(number)) ? String(Number(number)) : String(number ?? '').trim()
  return prefix.startsWith('A.') ? `A_${suffix}` : prefix.startsWith('B.') ? `B_${suffix}` : null
}

async function workbookFrom(file) {
  const workbook = new ExcelJS.Workbook()
  try { await workbook.xlsx.load(file) } catch { throw new ValidationError('File Excel tidak dapat dibaca atau formatnya rusak.') }
  return workbook
}

function sheetMatrix(sheet) {
  const rows = []
  for (let r=1; r<=sheet.rowCount; r++) {
    const row=[]
    for (let c=1; c<=sheet.columnCount; c++) row.push(valueOf(sheet.getCell(r,c).value))
    rows.push(row)
  }
  return rows
}

function extractRaw(sheet) {
  const matrix=sheetMatrix(sheet)
  if(matrix.length<2)throw new ValidationError('Sheet1 raw data kosong.')
  const headers=Object.fromEntries(matrix[0].map((value,index)=>[String(value??'').trim().toLowerCase(),index]))
  const required=['regional','nop','no','group','skor kpi']
  const missing=required.filter(name=>headers[name]===undefined)
  if(missing.length)throw new ValidationError(`Kolom raw Sheet1 tidak lengkap: ${missing.join(', ')}`)
  const result=Object.fromEntries(NOP_ORDER.map(nop=>[nop,Object.fromEntries(Object.keys(SOURCE_ROWS).map(key=>[key,null]))]))
  const sums=Object.fromEntries(NOP_ORDER.map(nop=>[nop,{}])); const periods=new Set()
  for(const row of matrix.slice(1)){
    const cell=name=>row[headers[name]]
    if(!cell('nop'))continue
    if(headers.month!==undefined&&headers.year!==undefined&&cell('month')!==null&&cell('year')!==null&&cell('month')!==''&&cell('year')!=='') periods.add(`${Number(cell('year'))}-${Number(cell('month'))}`)
    const canonical=NOP_ORDER.find(item=>normalizeNop(item)===normalizeNop(cell('nop')))
    if(!canonical)continue
    const key=sourceKey(cell('group'),cell('no')); if(!(key in SOURCE_ROWS))continue
    if(cell('skor kpi')===null||cell('skor kpi')==='')continue
    const score=Number(cell('skor kpi')); if(!Number.isFinite(score))throw new ValidationError(`Skor KPI tidak numerik untuk ${canonical}, No ${cell('no')}.`)
    sums[canonical][key]=(sums[canonical][key]||0)+score
  }
  const missingNops=[],missingComponents=[]
  const aKeys=['A_1','A_2','A_3','A_4','A_5','A_6'], bKeys=['B_1','B_2.1','B_2.2','B_2.3','B_3','B_4.1','B_4.2','B_5.1','B_5.2']
  for(const nop of NOP_ORDER){
    if(!Object.keys(sums[nop]).length){missingNops.push(nop);continue}
    for(const key of [...aKeys,...bKeys]){if(!(key in sums[nop]))missingComponents.push(`${nop}:${key}`);result[nop][key]=sums[nop][key]??null}
    result[nop].A=aKeys.reduce((n,key)=>n+(sums[nop][key]||0),0); result[nop].B=bKeys.reduce((n,key)=>n+(sums[nop][key]||0),0)
  }
  if(missingNops.length)throw new ValidationError(`NOP tidak ditemukan pada raw Sheet1: ${missingNops.join(', ')}`)
  if(missingComponents.length)throw new ValidationError(`Komponen KPI raw tidak lengkap: ${missingComponents.slice(0,8).join(', ')}${missingComponents.length>8?'...':''}`)
  if(periods.size>1)throw new ValidationError('Raw Sheet1 memiliki lebih dari satu periode Month/Year.')
  const periodText=[...periods][0]; const period=periodText?{year:Number(periodText.split('-')[0]),month:Number(periodText.split('-')[1])}:null
  return {nops:result,regions:REGION_NOPS,source:'Sheet1',period}
}

function extractSheet3(sheet){
  const matrix=sheetMatrix(sheet)
  if(matrix.length<19||(matrix[1]?.length||0)<17)throw new ValidationError('Sheet3 tidak sesuai struktur yang diharapkan (minimal 19 row dan 17 column).')
  const columns={}; matrix[1].forEach((value,index)=>{if(index&&value)columns[normalizeNop(value)]=index})
  const missing=NOP_ORDER.filter(nop=>columns[normalizeNop(nop)]===undefined); if(missing.length)throw new ValidationError(`NOP tidak lengkap pada Sheet3: ${missing.join(', ')}`)
  const result={}
  for(const nop of NOP_ORDER){result[nop]={};const col=columns[normalizeNop(nop)];for(const [key,row] of Object.entries(SOURCE_ROWS)){const raw=matrix[row-1]?.[col];const n=Number(raw);if(raw===null||raw===undefined||raw==='')result[nop][key]=null;else if(!Number.isFinite(n))throw new ValidationError(`Nilai tidak numerik untuk ${nop}, row ${row} pada Sheet3.`);else result[nop][key]=n}}
  return {nops:result,regions:REGION_NOPS,source:'Sheet3',period:null}
}

export async function extractDailyFile(buffer){
  const workbook=await workbookFrom(buffer)
  if(workbook.getWorksheet('Sheet1')){try{return extractRaw(workbook.getWorksheet('Sheet1'))}catch(error){if(!(error instanceof ValidationError))throw error}}
  if(workbook.getWorksheet('Sheet3'))return extractSheet3(workbook.getWorksheet('Sheet3'))
  throw new ValidationError('File harus memiliki Sheet1 raw data atau Sheet3 hasil final sesuai template.')
}

export const category=score=>score==null?'':score<80?'K':score<85?'C':score<90?'B':score<95?'BS':score<=100?'IS':''

export function buildDataset(extracted,date,filename){
  return {date,file:filename,regions:REGION_NOPS,rows:ROW_DEFINITIONS,nops:NOP_ORDER.map(name=>{const values={...extracted.nops[name]};values.kpi_score=values.A==null||values.B==null?null:values.A*.35+values.B*.65;values.category=category(values.kpi_score);return{name,region:NOP_TO_REGION[name],values}})}
}

const runDir=(runsDir,id)=>path.join(runsDir,id), statePath=(runsDir,id)=>path.join(runDir(runsDir,id),'state.json')
export async function createRun(runsDir){const id=crypto.randomBytes(6).toString('hex');await fs.mkdir(runDir(runsDir,id),{recursive:true});const state={id,upload:null,processed:false,report:null,prompt:'',history:true};await saveState(runsDir,state);return state}
export async function loadState(runsDir,id){try{return JSON.parse(await fs.readFile(statePath(runsDir,id),'utf8'))}catch(error){if(error.code==='ENOENT')throw new ValidationError('Run tidak ditemukan.');throw error}}
export async function saveState(runsDir,state){await fs.mkdir(runDir(runsDir,state.id),{recursive:true});await fs.writeFile(statePath(runsDir,state.id),JSON.stringify(state,null,2))}

const previousMonthPeriod=date=>{const source=new Date(`${date}T00:00:00Z`),previous=new Date(Date.UTC(source.getUTCFullYear(),source.getUTCMonth()-1,1));return {year:previous.getUTCFullYear(),month:previous.getUTCMonth()+1}}
const reportingPeriodLabel=(year,month)=>new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1)))
export async function uploadAndProcess(runsDir,id,file,uploadDate,reportingType='current'){
  const state=await loadState(runsDir,id), extracted=await extractDailyFile(file.buffer)
  const uploadYear=Number(uploadDate.slice(0,4)),uploadMonth=Number(uploadDate.slice(5,7)),uploadDay=Number(uploadDate.slice(8,10)),previous=previousMonthPeriod(uploadDate),rawIsPreviousMonth=Boolean(extracted.period&&extracted.period.month===previous.month&&extracted.period.year===previous.year),type=reportingType==='closing_previous_month'||(uploadDay>=1&&uploadDay<=5&&rawIsPreviousMonth)?'closing_previous_month':'current'
  if(type==='closing_previous_month'&&(!Number.isInteger(uploadDay)||uploadDay<1||uploadDay>5))throw new ValidationError('Upload Closing bulan sebelumnya hanya tersedia pada H+1 sampai H+5.')
  if(extracted.period){
    const expected=type==='closing_previous_month'?previous:{year:uploadYear,month:uploadMonth}
    if(extracted.period.month!==expected.month||extracted.period.year!==expected.year)throw new ValidationError(type==='closing_previous_month'?`File Closing harus berperiode ${String(expected.month).padStart(2,'0')}/${expected.year} (bulan sebelumnya).`:`Tanggal KPI tidak sesuai periode raw file: ${String(extracted.period.month).padStart(2,'0')}/${extracted.period.year}.`)
  }
  await fs.writeFile(path.join(runDir(runsDir,id),'kpi.xlsx'),file.buffer)
  const reporting_period=type==='closing_previous_month'?{type,source_period:`${previous.year}-${String(previous.month).padStart(2,'0')}`,closing_day:uploadDay,label:`${reportingPeriodLabel(previous.year,previous.month)} +${uploadDay}`}:{type:'current',source_period:`${uploadYear}-${String(uploadMonth).padStart(2,'0')}`,closing_day:null,label:reportingPeriodLabel(uploadYear,uploadMonth)}
  state.upload={filename:file.originalname,date:uploadDate,valid:true,nop_count:Object.keys(extracted.nops).length,reporting_type:type,reporting_period};state.processed=false;state.report=null
  const dataset={...buildDataset(extracted,uploadDate,file.originalname),reporting_period};await fs.writeFile(path.join(runDir(runsDir,id),'dataset.json'),JSON.stringify(dataset,null,2));state.processed=true
  const replaced=await saveHistory(id,dataset,state.upload);state.replaced_upload_count=replaced.length
  await Promise.all(replaced.map(old=>fs.rm(runDir(runsDir,old),{recursive:true,force:true})));await saveState(runsDir,state);return state
}

export const MTTR_TARGETS={CRITICAL:4,MAJOR:8,MINOR:10,LOW:13}
export const MTTR_TARGETS_B2={CRITICAL:2,MAJOR:4,MINOR:15,LOW:48,'VERY LOW':96}
export const MTTR_TARGETS_BY_COMPONENT={
  B_1:MTTR_TARGETS,
  'B_2.1':{CRITICAL:2,MAJOR:4,MINOR:15},
  'B_2.2':{CRITICAL:2,LOW:48},
  'B_2.3':{MAJOR:4,MINOR:15},
  B_3:{MINOR:15,LOW:48,'VERY LOW':96}
}
// Sama dengan Excel PERCENTILE.INC: posisi=(n-1)*p, lalu interpolasi linear.
export const percentileInc=(values,p)=>{
  const sorted=[...values].sort((a,b)=>a-b)
  if(!sorted.length)return null
  const index=(sorted.length-1)*p,lower=Math.floor(index),upper=Math.ceil(index)
  return sorted[lower]+(sorted[upper]-sorted[lower])*(index-lower)
}
// Simulasi tidak pernah mengubah MTTR ticket aktual. Setiap iterasi hanya
// menambahkan satu ticket baru berdurasi 1 jam hingga P90 minimum mencapai target.
export const ticketNeedForTarget=(items,target)=>{
  const actual=items.map(item=>Number(item.mttr_hours)).filter(value=>Number.isFinite(value)&&value>=0)
  const current=percentileInc(actual,.9)
  if(current<=target)return {needed:0,simulated:current,candidates:[]}
  // Hasilnya identik dengan P90(actual + Array(count).fill(1)), tetapi tidak
  // membuat/menyortir array baru setiap satu ticket. Ini penting untuk MTTR
  // ekstrem agar halaman tetap responsif; ticket simulasi tetap bernilai 1 jam.
  const sorted=[...actual].sort((a,b)=>a-b)
  const firstOne=sorted.findIndex(value=>value>=1)
  const oneIndex=firstOne<0?sorted.length:firstOne
  const projected=count=>{
    const length=sorted.length+count,index=(length-1)*.9,lower=Math.floor(index),upper=Math.ceil(index)
    const valueAt=rank=>rank>=oneIndex&&rank<oneIndex+count?1:sorted[rank-(rank>=oneIndex+count?count:0)]
    return valueAt(lower)+(valueAt(upper)-valueAt(lower))*(index-lower)
  }
  let high=1
  while(projected(high)>target)high*=2
  let low=0
  while(low+1<high){const middle=Math.floor((low+high)/2);if(projected(middle)<=target)high=middle;else low=middle}
  const needed=high,simulated=projected(needed)
  return {needed,simulated,candidates:Array.from({length:needed},(_,index)=>({source_row:index+1,mttr_hours:1,target,gap:0}))}
}

export function buildMttrMetrics(valuesBySeverity,targets=MTTR_TARGETS){
  return Object.entries(targets).map(([severity,target])=>{
    const items=(valuesBySeverity?.[severity]||[]).map((value,index)=>typeof value==='object'?{...value,mttr_hours:Number(value.mttr_hours)}:{mttr_hours:Number(value),source_row:index+1}).filter(item=>Number.isFinite(item.mttr_hours)&&item.mttr_hours>=0)
    const mttr=items.map(item=>item.mttr_hours)
    const label=severity.split(' ').map(part=>part[0]+part.slice(1).toLowerCase()).join(' ')
    if(!mttr.length)return {severity:label,target,achievement:null,currentP90:null,gap:null,status:'Tidak Ada Data',tickets:0,totalTickets:0,needed:null,ticketNeeded:null,simulated:null,projectedP90:null,candidates:[],candidateTickets:[]}
    const achievement=percentileInc(mttr,.9),boosting=ticketNeedForTarget(items,target),status=achievement<=target?'Target Tercapai':'Perlu Ditingkatkan'
    return {severity:label,target,achievement,currentP90:achievement,gap:achievement-target,status,tickets:mttr.length,totalTickets:mttr.length,needed:boosting.needed,ticketNeeded:boosting.needed,simulated:boosting.simulated,projectedP90:boosting.simulated,candidates:boosting.candidates,candidateTickets:boosting.candidates}
  })
}

export async function parseTicketMttrSummary(buffer,nop){
  const workbook=await workbookFrom(buffer),sheet=workbook.getWorksheet('Ticket List')||workbook.worksheets.find(item=>/ticket\s*list/i.test(item.name))
  if(!sheet)throw new ValidationError('File Ticket Summary harus memiliki sheet Ticket List.')
  const matrix=sheetMatrix(sheet),headers=Object.fromEntries((matrix[0]||[]).map((value,index)=>[String(value??'').trim().toLowerCase(),index]))
  if(headers.severity===undefined||headers.mttr===undefined)throw new ValidationError('Ticket List harus memiliki kolom Severity dan MTTR.')
  const values=Object.fromEntries(Object.keys(MTTR_TARGETS).map(key=>[key,[]]))
  for(const row of matrix.slice(1)){
    const severity=String(row[headers.severity]??'').trim().toUpperCase(),mttr=Number(row[headers.mttr])
    if(severity in values&&Number.isFinite(mttr)&&mttr>=0)values[severity].push(mttr)
  }
  const missing=Object.entries(values).filter(([,items])=>!items.length).map(([severity])=>severity)
  if(missing.length)throw new ValidationError(`Ticket List belum memiliki data MTTR untuk severity: ${missing.join(', ')}.`)
  const metrics=buildMttrMetrics(values)
  return {nop,metrics,source_rows:matrix.length-1}
}

export async function uploadTicketMttrSummary(runsDir,id,file,nop){
  const canonical=NOP_ORDER.find(item=>normalizeNop(item)===normalizeNop(nop))
  if(!canonical)throw new ValidationError('NOP Ticket Summary tidak sesuai dengan daftar NOP KPI.')
  const state=await loadState(runsDir,id)
  if(!state.upload)throw new ValidationError('Upload KPIData_SONL1 terlebih dahulu sebelum menambahkan Ticket Summary.')
  const dataset=await loadDataset(runsDir,id),summary=await parseTicketMttrSummary(file.buffer,canonical)
  dataset.ticket_summaries={...(dataset.ticket_summaries||{}),[canonical]:{...summary,filename:file.originalname,uploaded_at:new Date().toISOString()}}
  state.ticket_uploads={...(state.ticket_uploads||{}),[canonical]:{filename:file.originalname,date:dataset.date,row_count:summary.source_rows}}
  await fs.writeFile(path.join(runDir(runsDir,id),'dataset.json'),JSON.stringify(dataset,null,2))
  await saveHistory(id,dataset,state.upload)
  await saveState(runsDir,state)
  return {nop:canonical,filename:file.originalname,row_count:summary.source_rows,metrics:summary.metrics}
}

export async function processRun(runsDir,id){const state=await loadState(runsDir,id);if(!state.upload)throw new ValidationError('Upload satu file KPI terlebih dahulu.');const buffer=await fs.readFile(path.join(runDir(runsDir,id),'kpi.xlsx'));const dataset={...buildDataset(await extractDailyFile(buffer),state.upload.date,state.upload.filename),reporting_period:state.upload.reporting_period};await fs.writeFile(path.join(runDir(runsDir,id),'dataset.json'),JSON.stringify(dataset,null,2));state.processed=true;state.report=null;await saveHistory(id,dataset,state.upload);await saveState(runsDir,state);return dataset}
export async function loadDataset(runsDir,id){try{return JSON.parse(await fs.readFile(path.join(runDir(runsDir,id),'dataset.json'),'utf8'))}catch(error){const history=await loadHistoryDataset(id);if(history)return history;if(error.code==='ENOENT')return processRun(runsDir,id);throw error}}

const selectedNops=(dataset,region,nop,categoryFilter)=>dataset.nops.filter(item=>(!region||item.region===region)&&(!nop||item.name===nop)&&(!categoryFilter||item.values.category===categoryFilter))
export function buildAnalysis(dataset,region=null,nop=null,categoryFilter=null,baseline=null){
  const selected=selectedNops(dataset,region,nop,categoryFilter), lookup=Object.fromEntries((baseline?.nops||[]).map(item=>[item.name,item])), rows=Object.fromEntries(ROW_DEFINITIONS.map(row=>[row.key,row]))
  let comparisons=[]
  for(const item of selected){const current=item.values.kpi_score,previous=lookup[item.name]?.values?.kpi_score;if(Number.isFinite(current)&&Number.isFinite(previous))comparisons.push({nop:item.name,region:item.region,start:previous,end:current,delta:current-previous,start_category:category(previous),end_category:category(current)})}
  const currentNops=selected.map(item=>({nop:item.name,region:item.region,score:item.values.kpi_score,category:item.values.category}))
  if(!comparisons.length)comparisons=currentNops.filter(item=>Number.isFinite(item.score)).map(item=>({nop:item.nop,region:item.region,start:null,end:item.score,delta:null,start_category:null,end_category:item.category}))
  let changes=[];const eligible=ROW_DEFINITIONS.filter(row=>row.type==='component').map(row=>row.key)
  for(const item of selected){const prior=lookup[item.name];if(!prior)continue;for(const key of eligible){const start=prior.values[key],end=item.values[key];if(Number.isFinite(start)&&Number.isFinite(end))changes.push({nop:item.name,key,component:rows[key].label,start,end,delta:end-start})}}
  if(!changes.length)for(const key of eligible){const values=selected.map(item=>item.values[key]).filter(Number.isFinite);if(values.length)changes.push({key,component:rows[key].label,start:null,end:values.reduce((a,b)=>a+b,0)/values.length,delta:null})}
  const available=Boolean(baseline), rank=(items,reverse=false)=>[...items].sort((a,b)=>{const av=available?a.delta:a.end,bv=available?b.delta:b.end;return reverse?bv-av:av-bv}).slice(0,5), scores=currentNops.map(x=>x.score).filter(Number.isFinite)
  return {mode:nop?'nop':region?'region':'all',filter:{region,nop,category:categoryFilter},date:dataset.date,previous_date:baseline?.date||null,comparison_available:available,nop_count:selected.length,improved_count:comparisons.filter(x=>Number.isFinite(x.delta)&&x.delta>0).length,declined_count:comparisons.filter(x=>Number.isFinite(x.delta)&&x.delta<0).length,unchanged_count:comparisons.filter(x=>Number.isFinite(x.delta)&&Math.abs(x.delta)<1e-12).length,current_average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,top_nops:rank(comparisons,true),attention_nops:rank(comparisons),top_components:rank(changes,true),worst_components:rank(changes),current_nops:currentNops,selected_nops:selected.map(x=>x.name)}
}

export async function dashboardPayload(runsDir,id,region,nop,categoryFilter){const dataset=await loadDataset(runsDir,id);const baseline=await loadPreviousHistoryDataset(id,dataset.date);return{dataset,analysis:buildAnalysis(dataset,region,nop,categoryFilter,baseline)}}

const roundAi=value=>Array.isArray(value)?value.map(roundAi):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,roundAi(v)])):typeof value==='number'?Math.round(value*100)/100:value
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const localNumber=value=>Number.isFinite(Number(value))?Number(value).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}):'-'
const localDelta=value=>Number.isFinite(Number(value))?`${Number(value)>0?'+':''}${localNumber(value)}`:'-'
function generateLocalReport(analysis){
  const clean=value=>String(value||'').replace(/^NOP\s+/i,'')
  const filter=[analysis.filter?.region,analysis.filter?.nop&&`NOP ${clean(analysis.filter.nop)}`,analysis.filter?.category&&`Kategori ${analysis.filter.category}`].filter(Boolean).join(' · ')||'Semua Regional · Semua NOP · Semua Kategori'
  const ranking=items=>(items||[]).slice(0,5).map((item,index)=>`${index+1}. ${clean(item.nop||item.component)}: ${localNumber(item.start)} → ${localNumber(item.end)} *(${localDelta(item.delta)})*`).join('\n')||'-'
  const componentNop=item=>{const value=String(item.nop||'').trim();return value?/^NOP\s+/i.test(value)?value:`NOP ${value}`:'NOP tidak tersedia'}
  const components=items=>(items||[]).slice(0,5).map((item,index)=>`${index+1}. ${componentNop(item)} - ${item.component}: ${localNumber(item.start)} → ${localNumber(item.end)} *(${localDelta(item.delta)})*`).join('\n')||'-'
  if(!analysis.comparison_available){
    const snapshot=(analysis.current_nops||[]).map((item,index)=>`${index+1}. ${clean(item.nop)}: *${localNumber(item.score)}* · ${item.category||'-'}`).join('\n')||'-'
    return `📅 *KPI PERFORMANCE ${analysis.date}*\nFilter: ${filter}\nRata-rata KPI: *${localNumber(analysis.current_average)}*\nJumlah NOP: ${analysis.nop_count}\n\n📊 *KPI SNAPSHOT*\n${snapshot}`
  }
  if(analysis.mode==='nop'){
    const item=(analysis.top_nops||[])[0]||{}
    return `📊 *PERFORMANCE NOP ${clean(item.nop||analysis.filter?.nop)}*\nPeriode KPI: ${analysis.date}\nBaseline: ${analysis.previous_date}\nKPI Score: ${localNumber(item.start)} → ${localNumber(item.end)}\nPerubahan: ${localDelta(item.delta)}\nKategori: ${item.start_category||'-'} → ${item.end_category||'-'}\n\n━━━━━━━━━━━━━━━━━\n📈 *TOP 5 BEST Kenaikan di POINT KPI*\n${components(analysis.top_components)}\n\n━━━━━━━━━━━━━━━━━\n📉 *TOP 5 WORST Penurunan di POINT KPI*\n${components(analysis.worst_components)}`
  }
  return `📅 *KPI PERFORMANCE ${analysis.previous_date} - ${analysis.date}*\nFilter: ${filter}\nRata-rata KPI: *${localNumber(analysis.current_average)}*\n\n🏆 *TOP 5 NOP - KENAIKAN TERBAIK*\n\n${ranking(analysis.top_nops)}\n\n⚠️ *TOP 5 NOP - PERLU PERHATIAN*\n\n${ranking(analysis.attention_nops)}\n\n━━━━━━━━━━━━━━━━━\n📈 *TOP 5 BEST Kenaikan di POINT KPI*\n${components(analysis.top_components)}\n\n━━━━━━━━━━━━━━━━━\n📉 *TOP 5 WORST Penurunan di POINT KPI*\n${components(analysis.worst_components)}`
}
export async function generateReport(prompt,analysis){
  const primaryKey=process.env.GEMINI_API_KEY||'',fallbackKey=process.env.GEMINI_FALLBACK_API_KEY||primaryKey
  if(!primaryKey&&!fallbackKey)return generateLocalReport(analysis)
  const providers=[
    {model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',key:primaryKey||fallbackKey},
    {model:process.env.GEMINI_FALLBACK_MODEL||'gemini-3.5-flash',key:fallbackKey||primaryKey}
  ].filter((item,index,items)=>item.model&&item.key&&items.findIndex(other=>other.model===item.model&&other.key===item.key)===index),errors=[]
  const reportGuard='\n\nATURAN SISTEM TETAP: KPI Score adalah ringkasan per NOP dan tidak boleh dicantumkan dalam ranking komponen TOP 5 BEST maupun TOP 5 WORST. Gunakan hanya top_components dan worst_components yang dikirim sistem. Setiap item ranking komponen wajib menggunakan persis format: NOP [nama NOP] - [nama komponen]: [start] → [end] *([delta])*. Contoh: NOP BUKITTINGGI - Restoration Impact Service Incident Alarm: 36,60 → 36,40 *(-0,20)*.'
  const body={systemInstruction:{parts:[{text:`${prompt}${reportGuard}`}]},contents:[{role:'user',parts:[{text:`Berikut DATA TERSTRUKTUR hasil kalkulasi sistem. Gunakan angka dan ranking ini apa adanya.\n\n${JSON.stringify(roundAi(analysis),null,2)}`}]}]}
  for(const {model,key} of providers)for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});const data=await response.json();if(!response.ok)throw new Error(`Gemini API error (${response.status}) pada ${model}: ${data.error?.message||response.statusText}`);const text=data.candidates?.flatMap(x=>x.content?.parts||[]).map(x=>x.text).filter(Boolean).join('\n').trim();if(!text)throw new Error('Gemini API tidak mengembalikan output text.');return text}catch(error){errors.push(error.message);if(attempt<2)await sleep(1000*2**attempt+Math.random()*500)}}
  return generateLocalReport(analysis)
}
