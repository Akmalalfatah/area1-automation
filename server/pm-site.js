import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import {PROJECT_ROOT} from './config.js'
import {databaseEnabled,getPool,loadPreventiveRows,loadHistoricalPmSiteNotes,recordApplicationUpload} from './db.js'
import {workOrderKey,isTerminal} from './preventive.js'

export const normalizeSite=value=>String(value??'').trim().toUpperCase()
const key=value=>normalizeSite(value).replace(/[^A-Z0-9]/g,'')
const scalar=value=>value&&typeof value==='object'?('result' in value?value.result:'text' in value?value.text:'richText' in value?value.richText.map(x=>x.text).join(''):value):value
const numeric=value=>{const text=String(value??'').trim().replace(/^'/,'');return text!==''&&Number.isFinite(Number(text))?Number(text):null}
const durationMinutes=value=>{
  const direct=numeric(value);if(direct!==null)return direct
  const text=String(value??'').trim().replace(/^'/,'')
  const match=text.match(/^(-)?(\d+):(\d{2})(?::(\d{2}))?$/)
  if(!match)return null
  const total=(Number(match[2])*60+Number(match[3])+(Number(match[4]||0)/60))
  return match[1]?-total:total
}
export function sourceDate(value){
  value=scalar(value)
  if(value==null||value==='')return null
  if(value instanceof Date)return Number.isNaN(+value)?null:value.toISOString().slice(0,19)
  if(typeof value==='number')return sourceDate(new Date(Date.UTC(1899,11,30)+value*86400000))
  let text=String(value).trim().replace(/^'/,'')
  const match=text.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})(.*)$/)
  if(match)text=`${match[3]}-${match[2]}-${match[1]}${match[4]}`
  text=text.replace(' ','T')
  if(!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(text))return null
  const date=new Date(text.length===10?text+'T00:00:00Z':text+'Z')
  return Number.isNaN(+date)||date.toISOString().slice(0,10)!==text.slice(0,10)?null:text
}
const requirements={master:['SITEID','LAT','LON'],swfm:['SITEID','TICKETNUMBERSWFM','OCCUREDTIME'],swfm_exclude:['SITE','TICKETNO'],inap:['SITE','TTNUMBER','OCCUREDTIME'],ggr:['SITE','TICKETNO','PERIODDOWN']}
export async function parseSiteSource(buffer,kind){
  if(!requirements[kind])throw Object.assign(new Error('Jenis sumber tidak valid.'),{status:422})
  const workbook=new ExcelJS.Workbook()
  try{await workbook.xlsx.load(buffer)}catch{throw Object.assign(new Error('File Excel sumber tidak dapat dibaca.'),{status:422})}
  let sheet,header,columns
  for(const candidate of workbook.worksheets){
    for(let index=1;index<=Math.min(25,candidate.rowCount);index++){
      const mapped={};candidate.getRow(index).eachCell((cell,column)=>mapped[key(scalar(cell.value))]=column)
      if(requirements[kind].every(field=>mapped[field])){sheet=candidate;header=index;columns=mapped;break}
    }
    if(sheet)break
  }
  if(!sheet)throw Object.assign(new Error(`Header sumber ${kind} tidak sesuai: ${requirements[kind].join(', ')}`),{status:422})
  const records=new Map(),issues=[]
  for(let index=header+1;index<=sheet.rowCount;index++){
    const raw={};for(const [name,column] of Object.entries(columns))raw[name]=scalar(sheet.getCell(index,column).value)
    const get=(...names)=>names.map(name=>raw[name]).find(value=>value!==null&&value!==undefined&&value!=='')??''
    const original=String(get('SITEID','SITE')).trim()
    if(!original)continue
    const sites=kind==='inap'?original.split(/[;,\s]+/).filter(Boolean):[original]
    for(const site_id of sites){
      const base={site_id,site_key:normalizeSite(site_id),site_name:String(get('SITENAME')),nop:String(get('NOP')),regional:String(get('REGIONAL')),cluster:String(get('CLUSTER','CLUSTERTO')),source:kind,source_row:index}
      let record
      if(kind==='master')record={...base,class_site:String(get('SITECLASS','CLASSSITE')),type_site:String(get('TYPESITE')),active:String(get('SITEACTIVE')),owner:String(get('SITEOWNER')),genset_active:String(get('GENSETACTIVE')),genset_type:String(get('GENSETTYPE')),genset_capacity:numeric(get('GENSETCAPACITY')),latitude:numeric(get('LAT')),longitude:numeric(get('LON')),address:String(get('ADDRESS','SITEADDRESS','ALAMAT')),province:String(get('PROVINCE')),city:String(get('CITY')),subdistrict:String(get('SUBDISTRICT')),village:String(get('VILLAGE')),island:String(get('KEPULAUAN','ISLAND'))}
      else{
        const ticket=String(get('TICKETNUMBERSWFM','TTNUMBER','TICKETNO')).trim()
        if(!ticket){issues.push({row:index,site_id,message:'Ticket kosong'});continue}
        record={...base,ticket_no:ticket,parent_ticket:kind==='inap'?ticket:String(get('TICKETNUMBERINAP','INAPNO')).trim(),occurred_at:sourceDate(get('OCCUREDTIME','PERIODDOWN','SUBMITTEDDATE')),closed_at:sourceDate(get('CLEAREDTIME','CLOSEDAT','SITECLEAREDON','ENDTIME','APPROVEDDATE')),site_cleared_at:sourceDate(get('SITECLEAREDON')),severity:String(get('SEVERITY')),status:String(get('TICKETSWFMSTATUS','STATUS')),sla:String(get('SLASTATUS','INSLA')),rc_category:String(get('RCCATEGORY','ROOTCAUSECATEGORY','CATEGORY')),rc1:String(get('RC1','ROOTCAUSE1','INAPRC1')),rc2:String(get('RC2','ROOTCAUSE2','INAPRC2')),pic:String(get('PICTAKEOVERTICKET','PICNAME','RCOWNERENGINEER')),rca_validated:String(get('RCAVALIDATED')),resolution:String(get('RESOLUTIONACTION','INAPRESOLUTIONACTION','SUBMITTEDREASON','APPROVALREASON')),summary:String(get('SUMMARY','FAULTTEXT')),description:String(get('DESCRIPTION')),fault_level:String(get('FAULTLEVEL')),ticket_type:String(get('TICKETTYPE','TYPE','TYPETICKET')),duration_minutes:durationMinutes(get('DURATIONMINUTES','DURATIONTICKET','DURATION')),excluded:kind==='swfm_exclude'?'true':String(get('ISEXCLUDE','ISEXCLUDEDINKPI'))}
        if(!record.occurred_at&&kind!=='swfm_exclude')issues.push({row:index,site_id,message:'Waktu kejadian belum valid'})
      }
      const identity=kind==='master'?base.site_key:`${record.ticket_no}|${base.site_key}`
      if(records.has(identity))issues.push({row:index,site_id,message:'Duplikat identitas; baris terakhir dipakai'})
      records.set(identity,record)
    }
  }
  if(!records.size)throw Object.assign(new Error('Tidak ada baris sumber yang valid; data sebelumnya tidak diganti.'),{status:422})
  return{rows:[...records.values()],row_count:records.size,issues}
}

let previewPromise
async function preview(){
  if(!previewPromise)previewPromise=fs.readFile(path.join(PROJECT_ROOT,'data','pm-site-preview.json'),'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return{};throw error})
  return previewPromise
}
export async function saveSiteSource(kind,filename,date,dataset){
  if(!databaseEnabled)throw Object.assign(new Error('Import permanen membutuhkan konfigurasi MySQL. Preview membaca snapshot aktual secara read-only.'),{status:503})
  const connection=await getPool().getConnection()
  try{
    await connection.beginTransaction()
    const {rows,...metadata}=dataset,sourceUploadId=crypto.randomUUID()
    await connection.query('INSERT INTO pm_site_sources(source_kind,filename,upload_date,dataset) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE filename=VALUES(filename),upload_date=VALUES(upload_date),dataset=VALUES(dataset)',[kind,filename,date,JSON.stringify(metadata)])
    await connection.query('DELETE FROM pm_site_source_rows WHERE source_kind=?',[kind])
    for(let start=0;start<rows.length;start+=100){const values=rows.slice(start,start+100).map((row,index)=>[kind,start+index,JSON.stringify(row)]);await connection.query('INSERT INTO pm_site_source_rows(source_kind,row_no,payload) VALUES ?',[values])}
    await connection.query('INSERT INTO pm_site_source_uploads(source_upload_id,source_kind,filename,upload_date,dataset) VALUES(?,?,?,?,?)',[sourceUploadId,kind,filename,date,JSON.stringify(metadata)])
    for(let start=0;start<rows.length;start+=100){const values=rows.slice(start,start+100).map((row,index)=>[sourceUploadId,start+index,JSON.stringify(row)]);await connection.query('INSERT INTO pm_site_source_upload_rows(source_upload_id,row_no,payload) VALUES ?',[values])}
    const monthStart=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date()).slice(0,7)+'-01'
    // Master Site adalah backbone pemetaan Site/NOP dan selalu harus aktif.
    await connection.query("UPDATE pm_site_source_uploads SET archived_at=NULL WHERE source_kind='master'")
    await connection.query("UPDATE pm_site_source_uploads SET archived_at=COALESCE(archived_at,CURRENT_TIMESTAMP) WHERE source_kind<>'master' AND upload_date<?",[monthStart])
    await recordApplicationUpload(kind,sourceUploadId,filename,date,dataset.row_count,connection)
    await connection.commit()
    return{source_kind:kind,filename,row_count:dataset.row_count,issue_count:dataset.issues.length,source_upload_id:sourceUploadId}
  }catch(error){await connection.rollback().catch(()=>{});throw error}finally{connection.release()}
}
// Baris B1-B3 adalah sumber terbesar. Halaman Dashboard/PM tidak memerlukannya;
// sumber itu hanya diminta oleh Peningkatan KPI melalui siteDataForUploadMonth().
const kpiB13SourceKinds=['kpi_b13','kpi_b13_r01','kpi_b13_r02','kpi_b13_r10']
// Snapshot lama dapat tidak memiliki metadata `issues` atau bahkan payload dataset
// (misalnya sumber yang diimpor sebelum tabel snapshot dibuat). Semua halaman yang
// memilih bulan historis harus tetap dapat memakai baris sumber yang tersedia.
const safeDataset=value=>{
  try{const parsed=typeof value==='string'?JSON.parse(value):value;return parsed&&typeof parsed==='object'?parsed:{}}catch{return{}}
}

export async function siteData({includeKpiB13=false,includePm=true}={}){
  if(!databaseEnabled){
    const data=await preview(),uploaded=includePm?await loadPreventiveRows():[]
    const kinds=new Set(uploaded.map(row=>row.maintenance_kind))
    return{...data,pm:includePm?[...(data.pm||[]).filter(row=>!kinds.has(row.maintenance_kind)),...uploaded]:[],evaluations:[],punchlist_notes:[],read_only:true}
  }
  const sourceWhere=includeKpiB13?'':' WHERE source_kind NOT IN (?,?,?,?)'
  const sourceParams=includeKpiB13?[]:kpiB13SourceKinds
  const [sourceResult,evaluationResult,punchlistResult,historicalNotes,pm]=await Promise.all([
    getPool().query(`SELECT source_kind,filename,upload_date,dataset FROM pm_site_sources${sourceWhere}`,sourceParams),
    getPool().query('SELECT * FROM pm_site_evaluations'),
    getPool().query('SELECT site_id,note,updated_at FROM site_punchlist_notes'),
    loadHistoricalPmSiteNotes(),
    includePm?loadPreventiveRows():Promise.resolve([])
  ])
  const sources=sourceResult[0],evaluations=evaluationResult[0],punchlistNotes=punchlistResult[0]
  const data={pm,evaluations,punchlist_notes:punchlistNotes.map(row=>({...row,source:'review_l1'})),historical_notes:historicalNotes.map(row=>({...row,source:'punchlist_l0'})),sources:sources.map(({dataset,...meta})=>meta),quality:[],read_only:false}
  for(const source of sources){const dataset=safeDataset(source.dataset);data[source.source_kind]=dataset.rows||[];data.quality.push(...(dataset.issues||[]).map(issue=>({...issue,source:source.source_kind})))}
  const [records]=await getPool().query(`SELECT source_kind,payload FROM pm_site_source_rows${sourceWhere} ORDER BY source_kind,row_no`,sourceParams)
  for(const record of records){const payload=typeof record.payload==='string'?JSON.parse(record.payload):record.payload;data[record.source_kind].push(payload)}
  return data
}

const uploadMonth=value=>String(value||'').slice(0,7)
const sourceRowsForUploads=async (uploads,{period='',includeKpiB13=true}={})=>{
  const [punchlistNotes,evaluations,historicalNotes]=await Promise.all([
    getPool().query('SELECT site_id,note,updated_at FROM site_punchlist_notes').then(([rows])=>rows),
    getPool().query('SELECT * FROM pm_site_evaluations').then(([rows])=>rows),
    loadHistoricalPmSiteNotes()
  ])
  // Peningkatan KPI tidak membutuhkan data PM. Hindari membaca snapshot PM
  // yang besar saat hanya kalkulasi B1-B3/SWFM dijalankan.
  const data={pm:[],evaluations,punchlist_notes:punchlistNotes.map(row=>({...row,source:'review_l1'})),historical_notes:historicalNotes.map(row=>({...row,source:'punchlist_l0'})),sources:uploads.map(({dataset,...meta})=>meta),quality:[],read_only:false}
  if(uploads.length){
    const ids=uploads.map(upload=>upload.source_upload_id)
    const [records]=await getPool().query('SELECT source_upload_id,payload FROM pm_site_source_upload_rows WHERE source_upload_id IN (?) ORDER BY source_upload_id,row_no',[ids])
    const rowsByUpload=new Map(ids.map(id=>[id,[]]))
    for(const record of records)rowsByUpload.get(record.source_upload_id)?.push(typeof record.payload==='string'?JSON.parse(record.payload):record.payload)
    for(const upload of uploads){
      const dataset=safeDataset(upload.dataset)
      data[upload.source_kind]=rowsByUpload.get(upload.source_upload_id)||[]
      data.quality.push(...(dataset.issues||[]).map(issue=>({...issue,source:upload.source_kind})))
    }
  }
  // Kompatibilitas data yang diimpor sebelum penyimpanan snapshot per-upload
  // dibuat. Fallback hanya berlaku bila tanggal upload sumber aktif tepat pada
  // bulan pilihan, sehingga data antarbulan tetap tidak tercampur.
  if(/^\d{4}-\d{2}$/.test(period)){
    const [year,month]=period.split('-').map(Number),monthStart=`${period}-01`,monthEnd=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10)
    const [legacySources]=await getPool().query('SELECT source_kind,filename,upload_date,dataset FROM pm_site_sources WHERE upload_date>=? AND upload_date<?',[monthStart,monthEnd])
    const fallbackSources=legacySources.filter(source=>includeKpiB13||!kpiB13SourceKinds.includes(source.source_kind)).filter(source=>!(data[source.source_kind]||[]).length)
    if(fallbackSources.length){
      const kinds=fallbackSources.map(source=>source.source_kind)
      const [legacyRows]=await getPool().query('SELECT source_kind,payload FROM pm_site_source_rows WHERE source_kind IN (?) ORDER BY source_kind,row_no',[kinds])
      const rowsByKind=new Map(kinds.map(kind=>[kind,[]]))
      for(const row of legacyRows)rowsByKind.get(row.source_kind)?.push(typeof row.payload==='string'?JSON.parse(row.payload):row.payload)
      for(const source of fallbackSources){
        const dataset=safeDataset(source.dataset)
        data[source.source_kind]=rowsByKind.get(source.source_kind)||[]
        if(!data.sources.some(item=>item.source_kind===source.source_kind))data.sources.push({source_kind:source.source_kind,filename:source.filename,upload_date:source.upload_date})
        data.quality.push(...(dataset.issues||[]).map(issue=>({...issue,source:source.source_kind})))
      }
    }
  }
  // Master Site adalah backbone. Snapshot lama yang dibuat sebelum tabel snapshot
  // tersedia dapat tidak memiliki baris master; gunakan Master aktif sebagai fallback.
  if(!(data.master||[]).length){
    const [[masterSource],[masterRows]]=await Promise.all([
      getPool().query("SELECT filename,upload_date,dataset FROM pm_site_sources WHERE source_kind='master' LIMIT 1"),
      getPool().query("SELECT payload FROM pm_site_source_rows WHERE source_kind='master' ORDER BY row_no")
    ])
    if(masterSource){
      const dataset=safeDataset(masterSource.dataset)
      data.master=masterRows.map(row=>typeof row.payload==='string'?JSON.parse(row.payload):row.payload)
      if(!data.sources.some(source=>source.source_kind==='master'))data.sources.push({source_kind:'master',filename:masterSource.filename,upload_date:masterSource.upload_date})
      data.quality.push(...(dataset.issues||[]).map(issue=>({...issue,source:'master'})))
    }
  }
  return data
}

// Mengambil snapshot terbaru berdasarkan bulan pada tanggal saat file diunggah.
// Isi Date Occurred di dalam file tidak dipakai untuk memilih versi upload.
export async function siteDataForUploadMonth(period,{includeKpiB13=true}={}){
  if(!databaseEnabled)return{data:await siteData({includeKpiB13}),historical:false,available_periods:[]}
  const [periodRows]=await getPool().query("SELECT DISTINCT DATE_FORMAT(upload_date,'%Y-%m') AS period FROM pm_site_source_uploads WHERE upload_date IS NOT NULL ORDER BY period DESC")
  const available_periods=periodRows.map(row=>String(row.period||'')).filter(value=>/^\d{4}-\d{2}$/.test(value))
  if(!available_periods.length)return{data:await siteData({includeKpiB13}),historical:false,available_periods:[]}
  const selectedPeriod=/^\d{4}-\d{2}$/.test(String(period||''))?period:available_periods[0]
  const [year,month]=selectedPeriod.split('-').map(Number),monthStart=`${selectedPeriod}-01`,monthEnd=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10)
  // Metadata bulan lain hanya dipakai untuk mengisi dropdown di atas. Isi file/payload
  // yang dibaca di bawah ini eksklusif bulan terpilih; Master Site terbaru hanyalah referensi.
  const [candidateUploads]=await getPool().query('SELECT source_upload_id,source_kind,filename,upload_date,dataset,updated_at FROM pm_site_source_uploads WHERE (upload_date>=? AND upload_date<?) OR source_kind=? ORDER BY upload_date DESC,updated_at DESC',[monthStart,monthEnd,'master'])
  const uploadPeriod=upload=>{
    const date=upload.upload_date
    if(date instanceof Date)return date.toISOString().slice(0,7)
    const value=String(date||'')
    return /^\d{4}-\d{2}/.test(value)?value.slice(0,7):''
  }
  const selected=[],seen=new Set()
  for(const upload of candidateUploads){
    const isReference=upload.source_kind==='master'
    if((!includeKpiB13&&kpiB13SourceKinds.includes(upload.source_kind))||seen.has(upload.source_kind)||(!isReference&&uploadPeriod(upload)!==selectedPeriod))continue
    seen.add(upload.source_kind);selected.push(upload)
  }
  return{data:await sourceRowsForUploads(selected,{period:selectedPeriod,includeKpiB13}),historical:true,available_periods}
}

const milliseconds=value=>Date.parse(value?.length===10?value+'T00:00:00Z':value+'Z')
const day=86400000
const validated=value=>['TRUE','YES','YA','VALIDATED','VALID','1'].includes(normalizeSite(value))
const category=value=>{const text=normalizeSite(value);if(/POWER|ENERGY|PLN|GENSET|RECTIFIER|BATTERY/.test(text))return'Power';if(/TRANSM|TRANS|FIBER|MICROWAVE/.test(text))return'Transmisi';if(/RADIO|DEVICE|BTS|RAN|HARDWARE/.test(text))return'Radio/Device';if(/ACTIV|AKTIV|WORK|MAINTENANCE/.test(text))return'Aktivitas';return'Tidak tersedia'}
const indices=new WeakMap()
function siteIndex(data){
  if(indices.has(data))return indices.get(data)
  const master=new Map((data.master||[]).map(row=>[normalizeSite(row.site_id),row])),incidents=new Map(),evaluations=new Map(),punchlistsL0=new Map(),reviewsL1=new Map()
  for(const row of [...(data.swfm||[]),...(data.inap||[]),...(data.ggr||[])]){const site=normalizeSite(row.site_id);if(!incidents.has(site))incidents.set(site,[]);incidents.get(site).push(row)}
  for(const row of data.evaluations||[])evaluations.set(`${normalizeSite(row.site_id)}|${row.pm_ticket_no}`,row)
  // L0 adalah notes dari file PM Site (pencatatan lapangan). L1 adalah review
  // yang dibuat di website. Jangan pernah menyatukan atau menimpa keduanya.
  for(const row of data.pm||[])if(row.maintenance_kind==='site'&&String(row.notes||'').trim())punchlistsL0.set(normalizeSite(row.site_id),{site_id:normalizeSite(row.site_id),note:String(row.notes).trim(),updated_at:row._updated_at||null})
  for(const row of data.historical_notes||[])if(!punchlistsL0.has(normalizeSite(row.site_id)))punchlistsL0.set(normalizeSite(row.site_id),row)
  for(const row of data.punchlist_notes||[])if(String(row.source||'review_l1')==='review_l1')reviewsL1.set(normalizeSite(row.site_id),row)
  const index={master,incidents,evaluations,punchlistsL0,reviewsL1};indices.set(data,index);return index
}
export function scheduleLabel(pm,today=new Date().toISOString().slice(0,10)){
  const status=key(pm.status)
  if(['CLOSED','COMPLETED'].includes(status))return'Selesai'
  if(status==='TAKEOUT')return'Take Out'
  if(['CANCELED','CANCELLED'].includes(status))return'Dibatalkan'
  if(status==='SUBMITTED'||pm.submitted_date)return'Menunggu approval'
  const days=Math.round((milliseconds(pm.schedule_date)-milliseconds(today))/day)
  if(!Number.isFinite(days))return'Jadwal belum tersedia'
  if(days===0)return'Hari ini'
  return days<0?`Terlambat ${-days} hari`:`H-${days}`
}
export function analyzeSite(pm,data,today=new Date().toISOString().slice(0,10)){
  const index=siteIndex(data),site=normalizeSite(pm.site_id)
  const master=index.master.get(site)||null
  const last=milliseconds(pm.last_maintenance)
  const events=new Map()
  for(const row of index.incidents.get(site)||[]){
    if(normalizeSite(row.site_id)!==normalizeSite(pm.site_id))continue
    const occurred=milliseconds(row.occurred_at),delta=(occurred-last)/day
    const dateOnly=pm.last_maintenance?.length===10||row.occurred_at?.length===10
    const sameDay=pm.last_maintenance?.slice(0,10)===row.occurred_at?.slice(0,10)
    if(!Number.isFinite(delta)||delta<0||delta>30||(delta===0&&!dateOnly))continue
    const identity=row.source==='ggr'?`ggr|${row.ticket_no}`:`ticket|${row.parent_ticket||row.ticket_no}`
    const bucket=sameDay?'Hari 0':delta<=7?'Hari 1-7':delta<=14?'Hari 8-14':'Hari 15-30'
    const end=milliseconds(row.closed_at)
    const duration=Number.isFinite(end)&&end>=occurred?(end-occurred)/60000:row.duration_minutes
    const incident={...row,id:identity,delay_days:Math.floor(delta),bucket,time_confirmation:sameDay&&dateOnly,category:category(row.rc_category),validated:validated(row.rca_validated),duration_minutes:duration,type:row.source==='ggr'?'Genset Gagal Running':row.source==='inap'?'INAP Incident':/EVENT/.test(normalizeSite(row.ticket_type))?'SWFM Event':'SWFM Incident',lineage:[{source:row.source,ticket_no:row.ticket_no}]}
    const existing=events.get(identity)
    if(!existing)events.set(identity,incident)
    else{const preferred=existing.source==='swfm'?existing:incident.source==='swfm'?incident:existing;const rank=value=>({CRITICAL:4,MAJOR:3,MINOR:2,LOW:1}[normalizeSite(value)]||0);const severity=rank(existing.severity)>=rank(incident.severity)?existing.severity:incident.severity;const sla=[existing.sla,incident.sla].find(value=>/OUT/.test(normalizeSite(value)))||preferred.sla;events.set(identity,{...preferred,severity,sla,lineage:[...existing.lineage,...incident.lineage]})}
  }
  const incidents=[...events.values()].sort((a,b)=>milliseconds(a.occurred_at)-milliseconds(b.occurred_at))
  const swfm=incidents.filter(row=>row.source!=='ggr'),ggr=incidents.filter(row=>row.source==='ggr')
  const issues=[]
  for(const issue of data.quality||[])if(normalizeSite(issue.site_id)===site)issues.push(`${issue.source.toUpperCase()}: ${issue.message}`)
  if(!master)issues.push('Master site belum tersedia atau Site ID tidak ditemukan.')
  if(!pm.last_maintenance)issues.push('Last Maintenance belum tersedia; korelasi belum dapat dihitung.')
  for(const field of ['class_site','nop'])if(master?.[field]&&pm[field]&&normalizeSite(master[field])!==normalizeSite(pm[field]))issues.push(`${field==='nop'?'NOP':'Class Site'} historis PM berbeda dari master.`)
  const missingSources=['master','swfm','inap','ggr'].filter(source=>!Object.hasOwn(data,source))
  if(missingSources.length)issues.push(`Sumber tidak tersedia pada snapshot periode aktif: ${missingSources.join(', ')}.`)
  if(incidents.some(row=>row.time_confirmation))issues.push('Urutan waktu hari 0 perlu konfirmasi karena maintenance hanya memiliki tanggal.')
  const evaluation=index.evaluations.get(`${site}|${pm.ticket_no}`)||null,punchlistL0=index.punchlistsL0.get(site)||null,reviewL1=index.reviewsL1.get(site)||null
  const distributions={};for(const row of incidents){const item=distributions[row.category]||{category:row.category,count:0,validated:0,provisional:0};item.count++;item[row.validated?'validated':'provisional']++;distributions[row.category]=item}
  const critical=swfm.some(row=>/CRITICAL|MAJOR/.test(normalizeSite(row.severity)))
  const repeated=swfm.length>=2
  const priority=critical||repeated?'Tinggi':incidents.length||issues.length?'Sedang':'Rendah'
  const reasons=critical?['Ada gangguan Critical/Major.']:repeated?['Sedikitnya dua gangguan SWFM/INAP dalam jendela 30 hari.']:incidents.length?['Ada bukti pendukung gangguan pasca-maintenance.']:issues.length?['Kelengkapan data perlu dikonfirmasi.']:['Tidak ditemukan indikasi pada sumber dan jendela yang tersedia.']
  const status=evaluation&&evaluation.evaluation_status!=='Belum ditinjau'?'Sudah dievaluasi':issues.length?'Data perlu validasi':repeated?'Gangguan berulang':incidents.length?'Perlu ditinjau':'Tidak ada indikasi'
  const unknownDuration=swfm.filter(row=>row.duration_minutes==null).length
  const pln=incidents.some(row=>row.validated&&key(row.rc1)==='PLNOFF')
  return{pm,master,incidents,distribution:Object.values(distributions),issues,missing_sources:missingSources,evaluation,punchlist_l0_note:punchlistL0?.note||'',punchlist_l0_updated_at:punchlistL0?.updated_at||null,review_l1_note:reviewL1?.note||'',review_l1_updated_at:reviewL1?.updated_at||null,evaluation_label:status,priority,priority_reasons:reasons,schedule_label:scheduleLabel(pm,today),summary:{incident_count:swfm.length,ggr_count:ggr.length,first_delay:incidents[0]?.delay_days??null,total_downtime_minutes:swfm.reduce((sum,row)=>sum+(row.duration_minutes??0),0),unknown_duration:unknownDuration,validated_pln_off:pln},timeline:[{label:'Maintenance sebelumnya',date:pm.last_maintenance},...incidents.map(row=>({label:row.type,date:row.occurred_at,ticket_no:row.ticket_no})),{label:'Hari ini',date:today},{label:'Jadwal PM berikutnya',date:pm.schedule_date}].filter(row=>row.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))),read_only:!!data.read_only}
}
export function listSites(data,filters={}){
  const unique=new Map()
  for(const pm of data.pm||[])if(pm.maintenance_kind==='site')unique.set(workOrderKey(pm),pm)
  const analyzed=[...unique.values()].map(pm=>analyzeSite(pm,data))
  const option=field=>[...new Set(analyzed.map(detail=>field==='evaluation'?detail.evaluation_label:(detail.master?.[field]||detail.pm[field])).filter(Boolean))].sort()
  const rows=analyzed.filter(detail=>{
    const {pm,master}=detail
    if(filters.date_from&&pm.schedule_date<filters.date_from||filters.date_to&&pm.schedule_date>filters.date_to)return false
    for(const field of ['nop','regional'])if(filters[field]&&(master?.[field]||pm[field])!==filters[field])return false
    for(const field of ['status','pic','interval','scope_item_name','type_power'])if(filters[field]&&pm[field]!==filters[field])return false
    if(filters.site_id&&normalizeSite(filters.site_id)!==normalizeSite(pm.site_id))return false
    if(filters.evaluation&&detail.evaluation_label!==filters.evaluation)return false
    if(filters.incidents==='yes'&&!detail.incidents.length||filters.incidents==='no'&&detail.incidents.length)return false
    if(filters.schedule_state==='overdue'&&(!detail.schedule_label.startsWith('Terlambat')))return false
    if(filters.schedule_state==='submitted'&&!(pm.submitted_date||key(pm.status)==='SUBMITTED'))return false
    if(filters.schedule_state==='upcoming'&&(isTerminal(pm)||pm.submitted_date||pm.schedule_date<new Date().toISOString().slice(0,10)))return false
    const query=String(filters.search||'').trim().toLowerCase()
    return !query||[pm.site_id,master?.site_name||pm.site_name,pm.ticket_no].join(' ').toLowerCase().includes(query)
  }).map(detail=>({id:workOrderKey(detail.pm),...detail.pm,site_name:detail.master?.site_name||detail.pm.site_name,nop:detail.master?.nop||detail.pm.nop,regional:detail.master?.regional||detail.pm.regional,schedule_label:detail.schedule_label,evaluation_label:detail.evaluation_label,punchlist_l0_note:detail.punchlist_l0_note,punchlist_l0_updated_at:detail.punchlist_l0_updated_at,review_l1_note:detail.review_l1_note,review_l1_updated_at:detail.review_l1_updated_at,incident_count:detail.incidents.length,condition_label:detail.incidents.length?"Gangguan tercatat":!detail.pm.last_maintenance||detail.missing_sources.length?"Belum dapat dievaluasi":detail.issues.length?"Perlu ditinjau":"Tidak ada gangguan tercatat",condition_tone:detail.incidents.length?"red":!detail.pm.last_maintenance||detail.missing_sources.length?"gray":detail.issues.length?"orange":"green",priority:detail.priority}))
  return{rows,options:{nop:option('nop'),regional:option('regional'),status:option('status'),pic:option('pic'),interval:option('interval'),evaluation:option('evaluation')},read_only:!!data.read_only,sources:data.sources||[]}
}

const PUNCHLIST_RULES=[
  ['AC & VENTILASI','Exhaust Fan/Blower Rusak atau Tidak Ada',/\b(exhaust|exaus|exhous|blower|fan shelter|fan shlter)\b.*\b(rusak|mati|tidak ada|kurang|pengadaan|nok)\b|\b(rusak|mati|tidak ada|kurang|pengadaan|nok)\b.*\b(exhaust|exaus|exhous|blower|fan shelter|fan shlter)\b/i],
  ['RECTIFIER','MCB/DCDU/Distribusi DC Bermasalah',/\b(mcb|dcdu|dcd[u]?|fuse|sekring)\b.*\b(rusak|tidak standar|tidak ada|nok|perbaikan)\b|\b(rusak|tidak standar|tidak ada|nok|perbaikan)\b.*\b(mcb|dcdu|dcd[u]?|fuse|sekring)\b/i],
  ['RECTIFIER','Modul Rectifier Rusak atau Kurang',/\b(modul|module|apr)\b.*\b(rect|rusak|kurang|nok|tidak aktif)\b|\brect\w*\b.*\b(modul|module|apr)\b/i],
  ['GROUNDING','Grounding Tidak Ada atau Tidak Lengkap',/\b(sumur grounding|kaki tower|stickrut|splitjen|spilizen|grounding)\b.*\b(tidak ada|tidak|kurang|rusak|perbaikan|nok)\b|\b(tidak ada|kurang|rusak|perbaikan|nok)\b.*\b(sumur grounding|kaki tower|stickrut|splitjen|spilizen|grounding)\b/i],
  ['SIPIL & SHELTER','Bunker/Shelter Rusak',/\b(bunker|shelter)\b.*\b(rusak|bocor|retak|kotor|perbaikan)\b|\b(rusak|bocor|retak|kotor|perbaikan)\b.*\b(bunker|shelter)\b/i],
  ['SIPIL & SHELTER','Bracing/Struktur Tower Rusak',/\b(bracing|brace|tower space|besi siku)\b.*\b(rusak|hilang|stolen|curi|perbaikan)\b|\b(rusak|hilang|stolen|curi|perbaikan)\b.*\b(bracing|brace|tower space|besi siku)\b/i],
  ['BATTERY','Idle/Tidak Terpakai',/\b(idle|tidak terpakai|dismantle)\b.*\b(batt|batrai|baterai|cdc|vrla|lithium)\b|\b(batt|batrai|baterai|cdc|vrla|lithium)\b.*\b(idle|tidak terpakai|dismantle)\b/i],
  ['BATTERY','Kabel/MCB/Koneksi Battery Bermasalah',/\b(kabel|mcb|koneksi|terminal)\b.*\b(batt|batrai|baterai|cdc|vrla)\b|\b(batt|batrai|baterai|cdc|vrla)\b.*\b(kabel|mcb|koneksi|terminal)\b/i],
  ['BATTERY','Rusak/Degraded/Tidak Backup',/\b(batt|batrai|baterai|cdc|vrla|lithium)\b.*\b(rusak|drop|soak|degrad|nok|tidak backup|off)\b|\b(rusak|drop|soak|degrad|nok|tidak backup)\b.*\b(batt|batrai|baterai|cdc|vrla|lithium)\b/i],
  ['BATTERY','Tidak Ada/Hilang/Perlu Pengadaan',/\b(batt|batrai|baterai|cdc|vrla|lithium)\b.*\b(tidak ada|hilang|pengadaan|kurang)\b|\b(tidak ada|hilang|pengadaan)\b.*\b(batt|batrai|baterai|cdc|vrla|lithium)\b/i],
  ['GROUNDING','Grounding Rusak/Perlu Perbaikan',/\b(grounding|gronding|bar ground|bc50|busbar|splitjen)\b.*\b(rusak|putus|perbaikan|perlu)\b/i],
  ['GROUNDING','Grounding Tidak Ada/Tidak Lengkap',/\b(grounding|gronding|bar ground|bc50|busbar|splitjen)\b.*\b(tidak ada|kurang|tidak lengkap|hilang)\b/i],
  ['ARRESTER','Arrester ACPDB',/\b(arrester|arester)\b.*\bacpdb\b|\bacpdb\b.*\b(arrester|arester)\b/i],
  ['ARRESTER','Arrester ATS Genset',/\b(arrester|arester)\b.*\bats\b|\bats\b.*\b(arrester|arester)\b/i],
  ['ARRESTER','Arrester Rectifier',/\b(arrester|arester)\b.*\brect/i],
  ['ARRESTER','Arrester kWh/PLN',/\b(arrester|arester)\b.*\b(kwh|pln)\b|\b(kwh|pln)\b.*\b(arrester|arester)\b/i],
  ['RECTIFIER','Controller (NCU/SC/CU) Rusak/Tidak Ada',/\b(ncu|sc200|sc300|controller|cu|mcu|lvd)\b.*\b(rusak|faulty|blank|tidak ada|nok)\b/i],
  ['RECTIFIER','Modul Rectifier Rusak/Kurang',/\b(modul|module)\b.*\brect|\brect\w*\b.*\b(rusak|faulty|kurang|nok)\b/i],
  ['RECTIFIER','Fan Rectifier Rusak/Tidak Ada',/\bfan\b.*\brect|\brect\w*\b.*\bfan\b/i],
  ['BELTING & PENGAMANAN','Battery Belum Belting/Tanpa Pengaman',/\b(batt|batrai|battery)\b.*\b(belting|balting|pengaman|kerangkeng)\b/i],
  ['BELTING & PENGAMANAN','RBS/BTS Belum Belting/Tanpa Pengaman',/\b(rbs|bts|rack)\b.*\b(belting|balting|pengaman|kerangkeng)\b/i],
  ['BELTING & PENGAMANAN','Rectifier Belum Belting/Tanpa Pengaman',/\brect\w*\b.*\b(belting|balting|pengaman|kerangkeng)\b/i],
  ['LAMPU & PENERANGAN','Lampu Tower/OBL',/\b(lampu|obl)\b.*\b(tower|mati|tidak ada|rusak)\b/i],
  ['LAMPU & PENERANGAN','Lampu Shelter',/\b(lampu)\b.*\bshelter\b/i],
  ['LAMPU & PENERANGAN','Lampu Halaman/Taman',/\b(lampu)\b.*\b(halaman|taman|mercury)\b/i],
  ['AC & VENTILASI','AC Rusak/Tidak Ada',/\b(ac|air conditioner)\b.*\b(rusak|mati|tidak ada|nok|perbaikan)\b/i],
  ['AC & VENTILASI','Exhaust Fan/Blower Rusak/Tidak Ada',/\b(exhaust|blower)\b.*\b(rusak|mati|tidak ada|nok)\b/i],
  ['AC & VENTILASI','Shelter Panas',/\bshelter\b.*\bpanas\b|\bpanas\b.*\bshelter\b/i],
  ['PAGAR & KAWAT DURI','Pagar/Pintu Pagar Rusak',/\b(pagar|pintu pagar|tembok pagar)\b.*\b(rusak|tumbang|perbaikan|roboh)\b/i],
  ['PAGAR & KAWAT DURI','Kawat Duri Rusak/Perlu Peremajaan',/\bkawat duri\b.*\b(rusak|peremajaan|putus|tidak ada)\b/i],
  ['KEBERSIHAN & LINGKUNGAN','Halaman Semak/Kotor',/\b(semak|kotor|rumput)\b/i],
  ['KEBERSIHAN & LINGKUNGAN','Dahan/Pohon Masuk Site',/\b(dahan|pohon)\b.*\b(site|masuk)\b/i],
  ['KEBERSIHAN & LINGKUNGAN','Banjir/Genangan',/\b(banjir|genangan)\b/i],
  ['GENSET & ATS','Genset Rusak/Tidak Auto',/\bgenset\b.*\b(rusak|tidak auto|off|tidak running|mati)\b/i],
  ['GENSET & ATS','ATS Bermasalah',/\bats\b.*\b(rusak|bermasalah|peremajaan|nok)\b/i],
  ['PLN & kWh','PLN Off/Tegangan Tidak Stabil',/\bpln\b.*\b(off|tegangan|phasa|tidak stabil)\b/i],
  ['PLN & kWh','kWh Meter/Box Panel/Segel Bermasalah',/\b(kwh|meter|box panel|segel)\b.*\b(rusak|tidak ada|bermasalah|nok)\b/i],
  ['EAS & ALARM','EAS/Alarm Tidak Valid/Relay Rusak',/\b(eas|alarm|relay|mains fail|iob|emua|uim)\b.*\b(rusak|tidak valid|tidak terbaca|nok)\b/i],
  ['RBS & PERANGKAT RADIO','Antena/MW/RRU Tidak Ada/Rusak',/\b(antena|mw|rru)\b.*\b(rusak|tidak ada|hilang|nok)\b/i],
  ['RBS & PERANGKAT RADIO','Fan/Filter RBS Rusak',/\b(fan|filter)\b.*\brbs\b.*\b(rusak|nok|tidak ada)\b/i],
  ['SIPIL & SHELTER','Atap/Asbes Shelter Rusak',/\b(atap|asbes)\b.*\b(shelter|rusak|kropos)\b/i],
  ['SIPIL & SHELTER','Pondasi/Struktur Rusak/Hilang',/\b(pondasi|struktur|besi siku|brace)\b.*\b(rusak|hilang|perbaikan)\b/i],
  ['AKSES & KUNCI','Kunci/Gembok Tidak Ada/Tidak Cocok',/\b(kunci|gembok)\b.*\b(tidak ada|hilang|tidak cocok|rusak)\b/i],
  ['AKSES & KUNCI','Akses Jalan/Masuk Site Bermasalah',/\b(akses jalan|jalan masuk|akses site)\b.*\b(bermasalah|rusak|sulit|tidak bisa)\b/i],
  ['ASET IDLE','Perangkat/Rack Idle (Perlu Dismantle)',/\b(rack|perangkat|rbs|rectifier|ac)\b.*\b(idle|dismantle|tidak terpakai)\b/i],
  ['DATA ASET','Data Aset Tidak Sesuai/Kosong',/\b(data aset|data)\b.*\b(kosong|tidak sesuai|sinkron|diluruskan)\b/i],
  ['PENCURIAN & VANDALISME','Pencurian/Vandalisme',/\b(stolen|kecurian|maling|vandalisme)\b/i],
  ['SITE DOWN & TRANSMISI','Site Down/Transmisi Loss',/\b(site|bts|transmisi|metro|gpon)\b.*\b(down|loss|off)\b/i],
  ['KENDALA PEKERJAAN','Cuaca/Hujan',/\b(cuaca|hujan)\b/i],
  ['KENDALA PEKERJAAN','Tower/Pole Tidak Bisa Dipanjat/K3',/\b(tower|pole)\b.*\b(tidak bisa dipanjat|k3)\b/i]
]
export function classifyPunchlistNote(value){
  const note=String(value||'').trim()
  if(!note)return{status:'Notes Kosong',findings:[]}
  if(/^(tidak ada temuan|nihil|no finding)[.!\s]*$/i.test(note))return{status:'Tidak Ada Temuan',findings:[]}
  const findings=PUNCHLIST_RULES.filter(([, ,pattern])=>pattern.test(note)).map(([category,subcategory])=>({category,subcategory,quote:note,count:1}))
  if(!findings.length)findings.push({category:'LAINNYA',subcategory:'Lainnya',quote:note,count:1})
  return{status:'Ada Temuan',findings}
}
export async function listPunchlistSites(data,filters={}){
  const pmSiteRows=(data.pm||[]).filter(row=>row.maintenance_kind==='site'),months=[...new Set(pmSiteRows.map(row=>String(row.schedule_date||'').slice(0,7)).filter(value=>/^\d{4}-\d{2}$/.test(value)))].sort().reverse()
  const month=/^\d{4}-\d{2}$/.test(String(filters.month||''))?filters.month:''
  const end=month?new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate():null
  const {search,category,...sourceFilters}=filters
  const base=listSites(data,{...sourceFilters,date_from:month?`${month}-01`:filters.date_from,date_to:month?`${month}-${String(end).padStart(2,'0')}`:filters.date_to})
  const query=String(search||'').trim().toLowerCase()
  const summarize=level=>{
    const field=level==='punchlist_l0'?'punchlist_l0_note':'review_l1_note'
    const rows=base.rows.map(row=>{const note=String(row[field]||'').trim(),classified=classifyPunchlistNote(note),updated_at=level==='punchlist_l0'?row.punchlist_l0_updated_at:row.review_l1_updated_at;return{...row,note,updated_at:updated_at||null,punchlist_l0_note:String(row.punchlist_l0_note||'').trim(),review_l1_note:String(row.review_l1_note||'').trim(),status_note:classified.status,findings:classified.findings}}).filter(row=>{
      if(query&&![row.site_id,row.site_name,row.nop,row.regional,row.note].join(' ').toLowerCase().includes(query))return false
      return !category||row.findings.some(finding=>finding.category===category)
    })
    const regions=[...new Set(rows.map(row=>row.regional).filter(Boolean))].sort()
    const status_by_regional=['Ada Temuan','Tidak Ada Temuan','Notes Kosong'].map(status=>({status,...Object.fromEntries(regions.map(region=>[region,rows.filter(row=>row.regional===region&&row.status_note===status).length])),total:rows.filter(row=>row.status_note===status).length}))
    const allFindings=rows.flatMap(row=>row.findings.map(finding=>({...finding,regional:row.regional,site_id:row.site_id,ticket_no:row.ticket_no})))
    const countBy=(field,extra=[])=>[...new Set(allFindings.map(item=>item[field]))].sort().map(value=>{const items=allFindings.filter(item=>item[field]===value),byRegion=Object.fromEntries(regions.map(region=>[region,items.filter(item=>item.regional===region).length]));return{[field]:value,...Object.fromEntries(extra.map(key=>[key,items[0]?.[key]||''])),...byRegion,total:items.length,affected_sites:new Set(items.map(item=>item.ticket_no||item.site_id)).size}})
    return{rows,summary:{level,month,regions,total_tickets:rows.length,total_findings:allFindings.length,status_by_regional,category_counts:countBy('category'),subcategory_counts:countBy('subcategory',['category'])}}
  }
  const reviewL1=summarize('review_l1'),punchlistL0=summarize('punchlist_l0')
  return{rows:reviewL1.rows,l0_rows:punchlistL0.rows,options:{month:months,regional:[...new Set(base.rows.map(row=>row.regional).filter(Boolean))].sort(),nop:[...new Set(base.rows.map(row=>row.nop).filter(Boolean))].sort()},summary:reviewL1.summary,l0_summary:punchlistL0.summary}
}

export async function savePunchlistNote(siteId,input){
  if(!databaseEnabled)throw Object.assign(new Error('Penyimpanan Punchlist membutuhkan MySQL. Konfigurasikan database pada server/.env.'),{status:503})
  const normalized=normalizeSite(siteId),note=String(input?.note||'').trim()
  if(!normalized)throw Object.assign(new Error('Site ID wajib diisi.'),{status:422})
  if(note.length>5000)throw Object.assign(new Error('Catatan maksimal 5.000 karakter.'),{status:422})
  if(!note){await getPool().query('DELETE FROM site_punchlist_notes WHERE site_id=?',[normalized]);return{site_id:normalized,note:'',updated_at:null}}
  await getPool().query('INSERT INTO site_punchlist_notes(site_id,note) VALUES(?,?) ON DUPLICATE KEY UPDATE note=VALUES(note),updated_at=CURRENT_TIMESTAMP',[normalized,note])
  const [[saved]]=await getPool().query('SELECT site_id,note,updated_at FROM site_punchlist_notes WHERE site_id=?',[normalized])
  return saved
}
export const evaluationStatuses=['Belum ditinjau','Perlu konfirmasi NOP','Sedang ditindaklanjuti','Menunggu verifikasi','Selesai']
export function validateEvaluation(input){
  const result={}
  if(!evaluationStatuses.includes(input.evaluation_status)||!['Rendah','Sedang','Tinggi'].includes(input.priority))throw Object.assign(new Error('Status atau prioritas evaluasi tidak valid.'),{status:422})
  for(const field of ['evaluation_status','priority','evaluator_pic','conclusion','follow_up_action','verification_note']){if(typeof input[field]!=='string'||input[field].length>10000)throw Object.assign(new Error(`Nilai ${field} tidak valid.`),{status:422});result[field]=input[field].trim()}
  result.target_date=input.target_date||null
  if(result.target_date&&sourceDate(result.target_date)!==result.target_date)throw Object.assign(new Error('Target tanggal tidak valid.'),{status:422})
  return result
}
export async function saveEvaluation(pm,input){
  const value=validateEvaluation(input)
  if(!databaseEnabled)throw Object.assign(new Error('Penyimpanan evaluasi membutuhkan MySQL. Konfigurasikan database pada server/.env.'),{status:503})
  if(!pm.ticket_no)throw Object.assign(new Error('PM tanpa nomor ticket perlu validasi sebelum dievaluasi.'),{status:422})
  const columns=['evaluation_status','priority','evaluator_pic','conclusion','follow_up_action','target_date','verification_note']
  await getPool().query(`INSERT INTO pm_site_evaluations(site_id,pm_ticket_no,${columns.join(',')}) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE ${columns.map(column=>`${column}=VALUES(${column})`).join(',')}`,[normalizeSite(pm.site_id),pm.ticket_no,...columns.map(column=>value[column])])
  const [[saved]]=await getPool().query('SELECT * FROM pm_site_evaluations WHERE site_id=? AND pm_ticket_no=?',[normalizeSite(pm.site_id),pm.ticket_no])
  return saved
}
