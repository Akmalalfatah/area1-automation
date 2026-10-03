import ExcelJS from 'exceljs'
import {NOP_ORDER,REGION_NOPS} from './constants.js'
import {buildMttrMetrics,MTTR_TARGETS_BY_COMPONENT} from './services.js'

const key=value=>String(value??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'')
const scalar=value=>value&&typeof value==='object'?('result' in value?value.result:'text' in value?value.text:'richText' in value?value.richText.map(x=>x.text).join(''):value):value
const nopKey=value=>key(String(value||'').replace(/^NOP\s+/i,''))
const canonicalNop=value=>NOP_ORDER.find(item=>nopKey(item)===nopKey(value))||null
const componentLabels={
  RESTORATIONIMPACTSERVICEINCIDENTALARM:'B_1',
  RESTORATIONPOTENTIALIMPACTSERVICENONINCIDENTALARMENVA:'B_2.1',
  RESTORATIONIMPACTSERVICENONINCIDENTALARMCONTROLLER:'B_2.2',
  RESTORATIONIMPACTSERVICENONINCIDENTALARMIMPACTSERVICEALARM:'B_2.3',
  RESTORATIONIMPACTSERVICEDEGRADEDSERVICEP2P3OTHERSALARM:'B_3'
}

// Input KPIData dapat berupa kode B.2.2 atau label SOW lengkap dengan variasi
// kapitalisasi, spasi, tanda baca, dan line break. Semua harus menuju kode yang sama.
export const normalizeComponent=value=>{
  const raw=String(value??'').trim(),text=key(raw),match=raw.toUpperCase().match(/^B?[\s_.]*([123](?:\.[123])?)/)
  const token=(match?.[1]||'').replace(/^B\.?/i,'')
  return ({1:'B_1','1.0':'B_1','2.1':'B_2.1','2.2':'B_2.2','2.3':'B_2.3',3:'B_3','3.0':'B_3'})[token]||componentLabels[text]||null
}
const severity=value=>{const text=String(value??'').trim().toUpperCase().replace(/[\s_-]+/g,' ');return ['CRITICAL','MAJOR','MINOR','LOW','VERY LOW'].includes(text)?text:null}
const dateValue=value=>{
  value=scalar(value)
  if(value instanceof Date&&!Number.isNaN(+value))return value.toISOString().slice(0,19)
  if(typeof value==='number'){const date=new Date(Date.UTC(1899,11,30)+value*86400000);return Number.isNaN(+date)?null:date.toISOString().slice(0,19)}
  const date=new Date(String(value||'').trim());return Number.isNaN(+date)?null:date.toISOString().slice(0,19)
}
const number=value=>{const result=Number(scalar(value));return Number.isFinite(result)&&result>=0?result:null}
export async function parseKpiB13(buffer,expectedRegion=null){
  const workbook=new ExcelJS.Workbook()
  try{await workbook.xlsx.load(buffer)}catch{throw Object.assign(new Error('File KPIData_B1-3 tidak dapat dibaca.'),{status:422})}
  const required=['NOP','SOWNUM','SEVERITY','MTTRHOURS'];let sheet,header,columns
  for(const candidate of workbook.worksheets){for(let row=1;row<=Math.min(25,candidate.rowCount);row++){const mapped={};candidate.getRow(row).eachCell((cell,column)=>mapped[key(scalar(cell.value))]=column);if(required.every(name=>mapped[name])){sheet=candidate;header=row;columns=mapped;break}}if(sheet)break}
  if(!sheet)throw Object.assign(new Error(`Header KPIData_B1-3 tidak lengkap: ${required.join(', ')}`),{status:422})
  const get=(row,...names)=>names.map(name=>columns[name]&&scalar(row.getCell(columns[name]).value)).find(value=>value!==null&&value!==undefined&&value!=='')??''
  const rows=[],issues=[]
  for(let index=header+1;index<=sheet.rowCount;index++){
    const row=sheet.getRow(index),nop=canonicalNop(get(row,'NOP')),sow=normalizeComponent(get(row,'SOWNUM')),level=severity(get(row,'SEVERITY')),mttr=number(get(row,'MTTRHOURS'))
    if(!nop||!sow||!level||mttr===null){if(issues.length<500)issues.push({row:index,message:!nop?'NOP tidak dikenali':!sow?'SOW Num tidak dikenali':!level?'Severity tidak dikenali':'MTTR (Hours) tidak valid'});continue}
    const occurred_at=dateValue(get(row,'DATEOCCURED')),period=occurred_at?occurred_at.slice(0,7):null
    rows.push({nop,component:sow,severity:level,mttr_hours:mttr,period,ticket_number:String(get(row,'WOTICKETNO','INAPNO')).trim(),inap_no:String(get(row,'INAPNO')).trim(),wo_ticket_no:String(get(row,'WOTICKETNO')).trim(),site:String(get(row,'SITE')).trim(),site_name:String(get(row,'SITENAME')).trim(),sla:String(get(row,'SLA')).trim(),occurred_at,cleared_at:dateValue(get(row,'CLEAREDTIME','SITECLEAREDON')),fault_level:String(get(row,'FAULTLEVEL')).trim(),root_cause:String(get(row,'ROOTCAUSECATEGORY','ROOTCAUSE1','ROOTCAUSE2')).trim(),root_cause_category:String(get(row,'ROOTCAUSECATEGORY')).trim(),root_cause_1:String(get(row,'ROOTCAUSE1')).trim(),root_cause_2:String(get(row,'ROOTCAUSE2')).trim(),pic:String(get(row,'PICNAME')).trim(),source_row:index})
  }
  if(!rows.length){const summary=Object.entries(issues.reduce((result,item)=>{result[item.message]=(result[item.message]||0)+1;return result},{})).map(([message,count])=>`${message}: ${count}`).join('; ');throw Object.assign(new Error(`Tidak ada baris KPIData B.1-B.3 yang valid.${summary?' '+summary:''}`),{status:422})}
  if(expectedRegion){
    const allowed=new Set(REGION_NOPS[expectedRegion]||[]),outside=[...new Set(rows.filter(row=>!allowed.has(row.nop)).map(row=>row.nop))]
    if(!allowed.size)throw Object.assign(new Error('Regional KPIData B.1-B.3 tidak dikenali.'),{status:422})
    if(outside.length)throw Object.assign(new Error(`Isi file tidak sesuai ${expectedRegion}: ditemukan ${outside.join(', ')}.`),{status:422})
  }
  return {rows,row_count:rows.length,issues,sheet:sheet.name,regional:expectedRegion,periods:[...new Set(rows.map(row=>row.period).filter(Boolean))].sort()}
}

export function buildKpiB13Summaries(rows,nopNames,period){
  // Gunakan canonical NOP untuk setiap row maupun filter, bukan string mentah.
  // Ini mencegah "RANTAU  PRAPAT" atau "NOP Rantau Prapat" dianggap NOP lain.
  const aliases=new Map(nopNames.map(nop=>[nopKey(nop),nop])),grouped=new Map()
  for(const row of rows||[]){
    const nop=aliases.get(nopKey(row.nop)),code=normalizeComponent(row.component),level=severity(row.severity)
    if(!nop||!code||!level||String(row.occurred_at||'').slice(0,7)!==period)continue
    const id=`${nop}|${code}|${level}`
    if(!grouped.has(id))grouped.set(id,[])
    grouped.get(id).push({...row,nop,component:code,severity:level})
  }
  const summaries={}
  for(const nop of nopNames){
    const components={}
    for(const code of Object.keys(MTTR_TARGETS_BY_COMPONENT)){
      const targets=MTTR_TARGETS_BY_COMPONENT[code]
      const values=Object.fromEntries(Object.keys(targets).map(level=>[level,grouped.get(`${nop}|${code}|${level}`)||[]]))
      components[code]=buildMttrMetrics(values,targets)
    }
    const source_rows=Object.values(components).flat().reduce((sum,item)=>sum+Number(item.tickets||0),0)
    if(source_rows)summaries[nop]={nop,components,metrics:components.B_1,source:'KPIData B.1-B.3',source_rows,period}
  }
  return summaries
}
