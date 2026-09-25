import ExcelJS from 'exceljs'
import {siteData,normalizeSite,sourceDate} from './pm-site.js'
import {databaseEnabled,getPool} from './db.js'
import {workOrderKey} from './preventive.js'

// Coverage is declared by the data owner; observed dates alone do not prove completeness.
export const gensetRules={windowDays:7,nearHours:24,earlyDays:2,coverage:{}}
// Additive source fields; existing PM Site fields and interpretation stay intact.
export async function enrichGensetSource(buffer,kind,dataset){
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(buffer)
  const key=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'')
  let sheet,columns
  for(const candidate of workbook.worksheets){for(let i=1;i<=Math.min(candidate.rowCount,25);i++){const map={};candidate.getRow(i).eachCell((cell,col)=>map[key(cell.value)]=col);if((map.SITEID||map.SITE)&&(kind==='master'?map.GENSETCAPACITY:kind==='ggr'?map.PERIODDOWN:map.OCCUREDTIME)){sheet=candidate;columns=map;break}}if(sheet)break}
  if(!sheet)return dataset
  for(const row of dataset.rows){const get=(...names)=>{for(const name of names){if(!columns[name])continue;const value=sheet.getCell(row.source_row,columns[name]).value;if(value!==null&&value!=='')return value&&typeof value==='object'&&'result'in value?value.result:value}return ''}
    if(kind==='master'){row.genset_last_maintenance=sourceDate(get('LASTMAINTENANCEGENSET'));row.genset_pic=String(get('PICGENSET'));}
    else {row.pic=String(get('PICTAKEOVERTICKET','PIC','ASSIGNEE'));row.resolution_category=String(get('RESOLUTIONCATEGORY'));}
  }
  return dataset
}
const DAY=86400000
const time=value=>{if(!value)return NaN;const text=String(value).replace(' ','T');return Date.parse(text.length===10?text+'T00:00:00Z':/[Z]|[+-]\d\d:\d\d$/.test(text)?text:text+'Z')}
const iso=value=>new Date(value).toISOString().slice(0,19)
const clean=value=>String(value||'').trim().toUpperCase()
const power=row=>/POWER|ENERGY|GENSET|PLN|RECTIFIER|BATTERY|BATERAI/.test(clean(row.rc_category))||(!row.rc_category&&/GENSET|PLN|RECTIFIER|BATTERY|BATERAI|POWER/.test(clean(row.rc1)))
export const slaState=value=>/OUT|BREACH|NOT.?IN/.test(clean(value))?'Out SLA':/^IN\b|^YES$|^TRUE$/.test(clean(value))?'In SLA':'Data belum tersedia'
const duration=row=>{const start=time(row.occurred_at),end=time(row.closed_at);return Number.isFinite(end)&&end>=start?(end-start)/60000:Number.isFinite(row.duration_minutes)&&row.duration_minutes>=0?row.duration_minutes:null}
export function mergePowerTickets(data,site){
  const groups=new Map()
  for(const row of [...(data.swfm||[]),...(data.inap||[])]){
    if(normalizeSite(row.site_id)!==site)continue
    const id=String(row.parent_ticket||row.ticket_no||'').trim();if(!id)continue
    const previous=groups.get(id),entry={...row,id:'power|'+id,duration_minutes:duration(row),kind:'Ticket Power',lineage:[{source:row.source,ticket_no:row.ticket_no}],power:power(row)}
    if(!previous){groups.set(id,entry);continue}
    const preferred=previous.source==='swfm'?previous:row.source==='swfm'?entry:previous
    const other=preferred===previous?entry:previous
    groups.set(id,{...preferred,rc1:preferred.rc1||other.rc1,rc2:preferred.rc2||other.rc2,rc_category:preferred.rc_category||other.rc_category,resolution:preferred.resolution||other.resolution,severity:preferred.severity||other.severity,duration_minutes:preferred.duration_minutes??other.duration_minutes,sla:[previous.sla,entry.sla].find(value=>slaState(value)==='Out SLA')||preferred.sla||other.sla,power:previous.power||entry.power,lineage:[...previous.lineage,...entry.lineage]})
  }
  return [...groups.values()].filter(row=>row.power).map(row=>({...row,sla_state:slaState(row.sla)}))
}
export function analyzeGenset(pm,data,options={}){
  const rules={...gensetRules,...options,coverage:{...gensetRules.coverage,...options.coverage}}
  if(!Number.isInteger(rules.windowDays)||rules.windowDays<1||rules.windowDays>90)throw Object.assign(new Error('Periode evaluasi harus 1–90 hari.'),{status:422})
  const site=normalizeSite(pm.site_id),master=(data.master||[]).find(row=>normalizeSite(row.site_id)===site)||null
  const closed=clean(pm.status)==='CLOSED'&&String(pm.closed_at||pm.completed_date||'').length>10?pm.closed_at||pm.completed_date:null
  const rawAnchor=closed||pm.submitted_date,anchor=Number.isFinite(time(rawAnchor))?rawAnchor:null,at=time(anchor),dateOnly=!!anchor&&anchor.length===10
  const beforeStart=at-rules.windowDays*DAY,beforeEnd=at,afterStart=at+(dateOnly?DAY:0),afterEnd=afterStart+rules.windowDays*DAY
  const ggrMap=new Map()
  for(const row of data.ggr||[])if(normalizeSite(row.site_id)===site&&row.ticket_no)ggrMap.set(row.ticket_no,{...row,id:'ggr|'+row.ticket_no,kind:'GGR',duration_minutes:duration(row),sla_state:'Data belum tersedia',lineage:[{source:'ggr',ticket_no:row.ticket_no}]})
  const powerRows=mergePowerTickets(data,site)
  const events=[...ggrMap.values(),...powerRows].filter(row=>{const t=time(row.occurred_at);return Number.isFinite(at)&&t>=beforeStart&&t<afterEnd}).map(row=>({...row,period:time(row.occurred_at)<beforeEnd?'Sebelum':time(row.occurred_at)>=afterStart&&time(row.occurred_at)!==at?'Sesudah':'Hari PM · perlu konfirmasi'})).sort((a,b)=>time(a.occurred_at)-time(b.occurred_at))
  const sourcePresent=kind=>Object.hasOwn(data,kind)&&Array.isArray(data[kind])
  const coverage=Object.fromEntries(['ggr','swfm','inap'].map(kind=>{
    const metadata=(data.sources||[]).find(row=>row.source_kind===kind)||{}
    const declared=rules.coverage[kind]||{start:metadata.coverage_start,end:metadata.coverage_end}
    const dates=(data[kind]||[]).map(row=>time(row.occurred_at)).filter(Number.isFinite)
    const observed=dates.length?{start:iso(Math.min(...dates)),end:iso(Math.max(...dates))}:null
    const full=sourcePresent(kind)&&Number.isFinite(at)&&time(declared.start)<=beforeStart&&time(declared.end)>=afterEnd
    return [kind,{available:sourcePresent(kind),full,declared,observed}]
  }))
  const missing=[]
  if(!anchor)missing.push('Submitted Date atau waktu Closed PM belum tersedia.')
  if(!master)missing.push('Master site belum tersedia.')
  for(const kind of ['ggr','swfm','inap'])if(!coverage[kind].available)missing.push(`Sumber ${kind.toUpperCase()} belum tersedia.`)
  if(Object.values(coverage).some(item=>!item.full))missing.push('Kelengkapan dua jendela waktu belum terkonfirmasi; angka merupakan kejadian yang tercatat pada sumber.')
  if(dateOnly)missing.push('Submission hanya memiliki tanggal. Kejadian pada hari PM tidak dimasukkan ke perbandingan sebelum/sesudah.')
  const before=events.filter(row=>row.period==='Sebelum'),after=events.filter(row=>row.period==='Sesudah')
  const bg=before.filter(row=>row.kind==='GGR'),ag=after.filter(row=>row.kind==='GGR'),bp=before.filter(row=>row.kind==='Ticket Power'),ap=after.filter(row=>row.kind==='Ticket Power')
  const ggrAvailable=coverage.ggr.available&&!!anchor,ticketAvailable=(coverage.swfm.available||coverage.inap.available)&&!!anchor
  const sum=rows=>rows.some(row=>row.duration_minutes===null)?null:rows.reduce((total,row)=>total+row.duration_minutes,0)
  const metrics=[['Jumlah GGR',ggrAvailable?bg.length:null,ggrAvailable?ag.length:null,'kejadian',coverage.ggr.full],['Akumulasi durasi GGR',ggrAvailable?sum(bg):null,ggrAvailable?sum(ag):null,'menit',coverage.ggr.full],['Ticket gangguan Power',ticketAvailable?bp.length:null,ticketAvailable?ap.length:null,'ticket',coverage.swfm.full&&coverage.inap.full],['Ticket Power Out SLA',ticketAvailable?bp.filter(row=>row.sla_state==='Out SLA').length:null,ticketAvailable?ap.filter(row=>row.sla_state==='Out SLA').length:null,'ticket',coverage.swfm.full&&coverage.inap.full&&![...bp,...ap].some(row=>row.sla_state==='Data belum tersedia')]].map(([label,before,after,unit,complete])=>({label,before,after,unit,complete:complete&&before!==null&&after!==null,change:before===null||after===null?'Belum dapat dibandingkan':after===before?'Tetap':after>before?'Meningkat':'Menurun',percent:complete&&before>0&&after!==null?Math.round((after-before)/before*1000)/10:null,zero_baseline:before===0&&after>0}))
  const near=(ggr,ticket)=>Math.abs(time(ticket.occurred_at)-time(ggr.occurred_at))<=rules.nearHours*3600000||(Number.isFinite(time(ticket.closed_at))&&time(ticket.occurred_at)<=time(ggr.occurred_at)&&time(ticket.closed_at)>=time(ggr.occurred_at))
  const relate=(ggrRows,tickets)=>ggrRows.map(ggr=>({ggr_id:ggr.id,ticket_ids:tickets.filter(ticket=>near(ggr,ticket)).map(ticket=>ticket.id)}))
  const related=relate(ag,ap)
  const timeline_related=relate(events.filter(row=>row.kind==='GGR'),events.filter(row=>row.kind==='Ticket Power'))
  const relatedIds=new Set(related.flatMap(row=>row.ticket_ids)),relatedTickets=ap.filter(row=>relatedIds.has(row.id)),out=relatedTickets.filter(row=>row.sla_state==='Out SLA').length
  const reasons=[]
  if(ag.some(row=>(time(row.occurred_at)-at)/DAY<=rules.earlyDays))reasons.push(`GGR tercatat dalam ${rules.earlyDays} hari setelah acuan PM.`)
  if(metrics.slice(0,2).some(row=>row.before!==null&&row.after!==null&&row.after>row.before))reasons.push('Jumlah atau durasi GGR tercatat meningkat pada jendela sesudah.')
  if(ag.length>=2)reasons.push('GGR berulang pada jendela sesudah.')
  if(out)reasons.push(`${out} ticket Power Out SLA berdekatan dengan GGR (±${rules.nearHours} jam atau interval ticket mencakup GGR).`)
  if(ag.length&&!relatedTickets.length)missing.push('GGR pasca-PM tidak memiliki ticket Power terkait; bukti operasional belum cukup.')
  const invalidTimes=[...ggrMap.values(),...powerRows].filter(row=>!Number.isFinite(time(row.occurred_at))).length
  const unknownDuration=events.filter(row=>row.period!=='Hari PM · perlu konfirmasi'&&row.duration_minutes===null).length
  const unknownSla=[...bp,...ap].filter(row=>row.sla_state==='Data belum tersedia').length
  if(invalidTimes)missing.push(`${invalidTimes} kejadian pada site memiliki waktu belum valid; penempatan jendela belum dapat dilakukan.`)
  if(unknownDuration)missing.push(`${unknownDuration} durasi kejadian belum tersedia; total durasi belum dapat dievaluasi.`)
  if(unknownSla)missing.push(`${unknownSla} ticket Power belum memiliki status SLA; jumlah Out SLA yang ditampilkan hanya status yang tercatat.`)
  const full=!!anchor&&!!master&&Object.values(coverage).every(row=>row.full)&&!invalidTimes&&!unknownDuration&&!unknownSla
  const risk=ag.length>0||ap.length>0,priority=out?'Tinggi':risk?'Sedang':full?'Rendah':'Belum dapat dievaluasi'
  const status=!anchor||!ggrAvailable||!ticketAvailable?'Belum dapat dievaluasi':ag.length>=2?`Terindikasi gangguan berulang ${closed?'setelah PM selesai':'pasca-submission PM'}`:risk?'Kesiapan genset perlu ditinjau':full?'Kondisi relatif stabil':'Belum cukup data untuk evaluasi'
  if(ap.length&&!relatedTickets.length)reasons.push('Ticket Power tercatat setelah acuan PM; keterkaitan dengan genset belum terbukti.')
  if(!reasons.length)reasons.push(full?'Tidak ditemukan kejadian pada dua jendela yang cakupannya dikonfirmasi.':'Tidak ditemukan indikasi pada baris yang tersedia; kelengkapan jendela perlu dikonfirmasi.')
  const now=time(options.today||new Date().toISOString()),gaps=ag.slice(1).map((row,i)=>(time(row.occurred_at)-time(ag[i].occurred_at))/DAY),durations=ag.map(row=>row.duration_minutes).filter(value=>value!==null)
  const evaluation=(data.genset_evaluations||[]).find(row=>normalizeSite(row.site_id)===site&&row.pm_ticket_no===pm.ticket_no&&String(row.pm_period).slice(0,10)===pm.schedule_date)||null
  return {id:workOrderKey(pm),pm,master,anchor:anchor||null,anchor_label:closed?'setelah PM selesai':'setelah submission PM',date_only:dateOnly,rules:{windowDays:rules.windowDays,nearHours:rules.nearHours,earlyDays:rules.earlyDays},windows:anchor?{before_start:iso(beforeStart),before_end:iso(beforeEnd),after_start:iso(afterStart),after_end:iso(afterEnd)}:null,coverage,events,metrics,related,timeline_related,priority,status,reasons,missing,read_only:!!data.read_only,evaluation,reliability:{first_ggr_days:ag.length?(time(ag[0].occurred_at)-at)/DAY:null,average_gap_days:gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null,longest_minutes:durations.length&&durations.length===ag.length?Math.max(...durations):null,days_since_last:ag.length?Math.max(0,(now-time(ag.at(-1).occurred_at))/DAY):null},evidence:{ggr:ag.length,related_power:relatedTickets.length,out_sla:out},facts:[anchor?`${ggrAvailable?ag.length:'Data GGR belum tersedia'} GGR dan ${ticketAvailable?ap.length:'data ticket belum tersedia'} ticket Power tercatat ${closed?'setelah PM selesai':'setelah submission PM'} dalam jendela ${rules.windowDays} hari.`:'Acuan PM belum tersedia.',anchor&&ggrAvailable&&ticketAvailable?`${relatedTickets.length} ticket Power cocok secara Site ID dan waktu; hubungan sebab-akibat membutuhkan verifikasi.`:'Keterkaitan GGR dan ticket belum dapat dievaluasi.'],unavailable:[...missing,'Checklist PM, load test, baterai starter, jam operasi genset, serta bahan bakar belum tersedia pada sumber.'],actions:risk?['Periksa checklist PM dan RCA ticket terkait.','Verifikasi kesiapan baterai starter, bahan bakar, dan load test di lapangan.']:['Konfirmasi cakupan sumber dan lengkapi bukti pemeriksaan genset.']}
}
export async function gensetData(){const data=await siteData();if(databaseEnabled){const [rows]=await getPool().query('SELECT * FROM pm_genset_evaluations');data.genset_evaluations=rows}return data}
export const gensetEvaluationStatuses=['Belum dievaluasi','Perlu ditinjau','Terverifikasi bermasalah','Tidak berkaitan dengan PM','Menunggu verifikasi lapangan','Selesai dievaluasi']
export function validateGensetEvaluation(input){
  if(!gensetEvaluationStatuses.includes(input.evaluation_status))throw Object.assign(new Error('Status evaluasi tidak valid.'),{status:422})
  const value={evaluation_status:input.evaluation_status}
  for(const field of ['follow_up_pic','conclusion','follow_up_action','additional_note']){if(typeof input[field]!=='string'||input[field].length>10000)throw Object.assign(new Error(`Nilai ${field} tidak valid.`),{status:422});value[field]=input[field].trim()}
  const date=input.target_date||null
  if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(time(date))||iso(time(date)).slice(0,10)!==date))throw Object.assign(new Error('Target penyelesaian tidak valid.'),{status:422})
  value.target_date=date;return value
}
export async function saveGensetEvaluation(pm,input){
  if(!databaseEnabled)throw Object.assign(new Error('Penyimpanan evaluasi membutuhkan MySQL.'),{status:503})
  if(!pm.ticket_no)throw Object.assign(new Error('Nomor ticket PM belum tersedia.'),{status:422})
  const value=validateGensetEvaluation(input),columns=Object.keys(value)
  await getPool().query(`INSERT INTO pm_genset_evaluations(site_id,pm_ticket_no,pm_period,${columns.join(',')}) VALUES(?,?,?,${columns.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${columns.map(column=>`${column}=VALUES(${column})`).join(',')}`,[normalizeSite(pm.site_id),pm.ticket_no,pm.schedule_date,...columns.map(column=>value[column])])
  const [[saved]]=await getPool().query('SELECT * FROM pm_genset_evaluations WHERE site_id=? AND pm_ticket_no=? AND pm_period=?',[normalizeSite(pm.site_id),pm.ticket_no,pm.schedule_date]);return saved
}
