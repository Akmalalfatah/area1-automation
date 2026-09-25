import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import {PROJECT_ROOT} from './config.js'
import {databaseEnabled,getPool,loadPreventiveRows,recordApplicationUpload} from './db.js'
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
    const {rows,...metadata}=dataset
    await connection.query('INSERT INTO pm_site_sources(source_kind,filename,upload_date,dataset) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE filename=VALUES(filename),upload_date=VALUES(upload_date),dataset=VALUES(dataset)',[kind,filename,date,JSON.stringify(metadata)])
    await connection.query('DELETE FROM pm_site_source_rows WHERE source_kind=?',[kind])
    for(let start=0;start<rows.length;start+=100){const values=rows.slice(start,start+100).map((row,index)=>[kind,start+index,JSON.stringify(row)]);await connection.query('INSERT INTO pm_site_source_rows(source_kind,row_no,payload) VALUES ?',[values])}
    await recordApplicationUpload(kind,crypto.randomUUID(),filename,date,dataset.row_count,connection)
    await connection.commit()
  }catch(error){await connection.rollback().catch(()=>{});throw error}finally{connection.release()}
  return{source_kind:kind,filename,row_count:dataset.row_count,issue_count:dataset.issues.length}
}
export async function siteData(){
  if(!databaseEnabled){const data=await preview(),uploaded=await loadPreventiveRows();const kinds=new Set(uploaded.map(row=>row.maintenance_kind));return{...data,pm:[...(data.pm||[]).filter(row=>!kinds.has(row.maintenance_kind)),...uploaded],evaluations:[],read_only:true}}
  const [sources]=await getPool().query('SELECT source_kind,filename,upload_date,dataset FROM pm_site_sources')
  const [evaluations]=await getPool().query('SELECT * FROM pm_site_evaluations')
  const data={pm:await loadPreventiveRows(),evaluations,sources:sources.map(({dataset,...meta})=>meta),quality:[],read_only:false}
  for(const source of sources){const dataset=typeof source.dataset==='string'?JSON.parse(source.dataset):source.dataset;data[source.source_kind]=dataset.rows||[];data.quality.push(...(dataset.issues||[]).map(issue=>({...issue,source:source.source_kind})))}
  const [records]=await getPool().query('SELECT source_kind,payload FROM pm_site_source_rows ORDER BY source_kind,row_no')
  for(const record of records){const payload=typeof record.payload==='string'?JSON.parse(record.payload):record.payload;data[record.source_kind].push(payload)}
  return data
}

const milliseconds=value=>Date.parse(value?.length===10?value+'T00:00:00Z':value+'Z')
const day=86400000
const validated=value=>['TRUE','YES','YA','VALIDATED','VALID','1'].includes(normalizeSite(value))
const category=value=>{const text=normalizeSite(value);if(/POWER|ENERGY|PLN|GENSET|RECTIFIER|BATTERY/.test(text))return'Power';if(/TRANSM|TRANS|FIBER|MICROWAVE/.test(text))return'Transmisi';if(/RADIO|DEVICE|BTS|RAN|HARDWARE/.test(text))return'Radio/Device';if(/ACTIV|AKTIV|WORK|MAINTENANCE/.test(text))return'Aktivitas';return'Tidak tersedia'}
const indices=new WeakMap()
function siteIndex(data){
  if(indices.has(data))return indices.get(data)
  const master=new Map((data.master||[]).map(row=>[normalizeSite(row.site_id),row])),incidents=new Map(),evaluations=new Map()
  for(const row of [...(data.swfm||[]),...(data.inap||[]),...(data.ggr||[])]){const site=normalizeSite(row.site_id);if(!incidents.has(site))incidents.set(site,[]);incidents.get(site).push(row)}
  for(const row of data.evaluations||[])evaluations.set(`${normalizeSite(row.site_id)}|${row.pm_ticket_no}`,row)
  const index={master,incidents,evaluations};indices.set(data,index);return index
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
  if(missingSources.length)issues.push(`Sumber belum diimpor: ${missingSources.join(', ')}.`)
  if(incidents.some(row=>row.time_confirmation))issues.push('Urutan waktu hari 0 perlu konfirmasi karena maintenance hanya memiliki tanggal.')
  const evaluation=index.evaluations.get(`${site}|${pm.ticket_no}`)||null
  const distributions={};for(const row of incidents){const item=distributions[row.category]||{category:row.category,count:0,validated:0,provisional:0};item.count++;item[row.validated?'validated':'provisional']++;distributions[row.category]=item}
  const critical=swfm.some(row=>/CRITICAL|MAJOR/.test(normalizeSite(row.severity)))
  const repeated=swfm.length>=2
  const priority=critical||repeated?'Tinggi':incidents.length||issues.length?'Sedang':'Rendah'
  const reasons=critical?['Ada gangguan Critical/Major.']:repeated?['Sedikitnya dua gangguan SWFM/INAP dalam jendela 30 hari.']:incidents.length?['Ada bukti pendukung gangguan pasca-maintenance.']:issues.length?['Kelengkapan data perlu dikonfirmasi.']:['Tidak ditemukan indikasi pada sumber dan jendela yang tersedia.']
  const status=evaluation&&evaluation.evaluation_status!=='Belum ditinjau'?'Sudah dievaluasi':issues.length?'Data perlu validasi':repeated?'Gangguan berulang':incidents.length?'Perlu ditinjau':'Tidak ada indikasi'
  const unknownDuration=swfm.filter(row=>row.duration_minutes==null).length
  const pln=incidents.some(row=>row.validated&&key(row.rc1)==='PLNOFF')
  return{pm,master,incidents,distribution:Object.values(distributions),issues,missing_sources:missingSources,evaluation,evaluation_label:status,priority,priority_reasons:reasons,schedule_label:scheduleLabel(pm,today),summary:{incident_count:swfm.length,ggr_count:ggr.length,first_delay:incidents[0]?.delay_days??null,total_downtime_minutes:swfm.reduce((sum,row)=>sum+(row.duration_minutes??0),0),unknown_duration:unknownDuration,validated_pln_off:pln},timeline:[{label:'Maintenance sebelumnya',date:pm.last_maintenance},...incidents.map(row=>({label:row.type,date:row.occurred_at,ticket_no:row.ticket_no})),{label:'Hari ini',date:today},{label:'Jadwal PM berikutnya',date:pm.schedule_date}].filter(row=>row.date).sort((a,b)=>String(a.date).localeCompare(String(b.date))),read_only:!!data.read_only}
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
  }).map(detail=>({id:workOrderKey(detail.pm),...detail.pm,site_name:detail.master?.site_name||detail.pm.site_name,nop:detail.master?.nop||detail.pm.nop,regional:detail.master?.regional||detail.pm.regional,schedule_label:detail.schedule_label,evaluation_label:detail.evaluation_label,incident_count:detail.incidents.length,condition_label:detail.incidents.length?"Gangguan tercatat":!detail.pm.last_maintenance||detail.missing_sources.length?"Belum dapat dievaluasi":detail.issues.length?"Perlu ditinjau":"Tidak ada gangguan tercatat",condition_tone:detail.incidents.length?"red":!detail.pm.last_maintenance||detail.missing_sources.length?"gray":detail.issues.length?"orange":"green",priority:detail.priority}))
  return{rows,options:{nop:option('nop'),regional:option('regional'),status:option('status'),pic:option('pic'),interval:option('interval'),evaluation:option('evaluation')},read_only:!!data.read_only,sources:data.sources||[]}
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
