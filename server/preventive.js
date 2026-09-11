import ExcelJS from 'exceljs'

const aliases={area:['area'],regional:['regional','region'],nop:['nop','nopname','namanop','nopcluster'],cluster:['clustername','cluster'],ticket_no:['ticketno','ticketnumber','ticket'],site_id:['siteid','idsite','sitecode','sitekode','site'],site_name:['sitename','namasite'],class_site:['classsite','siteclass','kelas'],type_site:['typesite','sitetype','tipe'],interval:['interval','maintenanceinterval'],last_maintenance:['lastmaintenance','lastmaintenancedate','maintenancebefore'],schedule_date:['scheduledate','planscheduledate','plandate','schedule','tanggalplan','jadwal'],diff_days:['diffdays','daydifference','selisihhari'],status:['status','pmstatus','maintenancestatus'],actual_date:['actualdate','tanggalactual','actual','completiondate','completeddate'],submitted_date:['submitteddate','submitdate','submissiondate','tanggalsubmit','submitted'],pic:['pic','personincharge'],notes:['notes','note','catatan','remark','remarks','keterangan'],created_date:['createddate','creationdate','tanggalbuat']}
const normalize=value=>String(value??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'')
const fieldFor=value=>Object.entries(aliases).find(([,values])=>values.includes(normalize(value)))?.[0]
const pad=n=>String(n).padStart(2,'0')
function isoDate(value){
  if(!value&&value!==0)return null
  if(value instanceof Date&&!Number.isNaN(value))return `${value.getUTCFullYear()}-${pad(value.getUTCMonth()+1)}-${pad(value.getUTCDate())}`
  if(typeof value==='number'){const date=new Date(Date.UTC(1899,11,30)+value*86400000);return isoDate(date)}
  const text=String(value).trim().slice(0,10);let m
  if((m=text.match(/^(\d{4})-(\d{2})-(\d{2})$/)))return `${m[1]}-${m[2]}-${m[3]}`
  if((m=text.match(/^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$/)))return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

export async function parsePreventiveWorkbook(buffer,filename){
  const workbook=new ExcelJS.Workbook();try{await workbook.xlsx.load(buffer)}catch{throw new Error('File Excel preventive tidak dapat dibaca.')}
  let selected,headerRow,headerMap
  for(const sheet of workbook.worksheets){for(let row=1;row<=Math.min(25,sheet.rowCount);row++){const mapped={};sheet.getRow(row).eachCell((cell,col)=>{const field=fieldFor(cell.value);if(field)mapped[col]=field});const values=Object.values(mapped);if(values.includes('site_id')&&values.includes('schedule_date')){selected=sheet;headerRow=row;headerMap=mapped;break}}if(selected)break}
  if(!selected)throw new Error('Header Excel tidak ditemukan. Minimal diperlukan kolom Site ID dan Schedule Date.')
  const rows=[]
  for(let row=headerRow+1;row<=selected.rowCount;row++){const record={};for(const [col,field] of Object.entries(headerMap))record[field]=selected.getCell(row,Number(col)).value;const site=String(record.site_id??'').trim(),schedule=isoDate(record.schedule_date);if(!site||!schedule)continue;const submitted=isoDate(record.submitted_date);rows.push({site_id:site,site_name:String(record.site_name||'-').trim()||'-',nop:String(record.nop||'Belum ditentukan').trim()||'Belum ditentukan',area:String(record.area||'').trim(),regional:String(record.regional||'').trim(),cluster:String(record.cluster||'').trim(),ticket_no:String(record.ticket_no||'').trim(),class_site:String(record.class_site||'').trim(),type_site:String(record.type_site||'').trim(),interval:String(record.interval||'').trim(),last_maintenance:isoDate(record.last_maintenance),schedule_date:schedule,diff_days:record.diff_days==null?'':String(record.diff_days).trim(),status:String(record.status||'').trim(),actual_date:isoDate(record.actual_date)||submitted,submitted_date:submitted,pic:String(record.pic||'').trim(),notes:String(record.notes||'').trim(),created_date:isoDate(record.created_date)})}
  if(!rows.length)throw new Error('Tidak ada baris preventive yang valid pada file Excel.')
  const counts={};for(const row of rows)counts[row.schedule_date.slice(0,7)]=(counts[row.schedule_date.slice(0,7)]||0)+1
  const dataMonth=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]
  return{filename,sheet:selected.name,rows,row_count:rows.length,date_start:rows.map(x=>x.schedule_date).sort()[0],date_end:rows.map(x=>x.schedule_date).sort().at(-1),data_month:dataMonth}
}

function dateBounds(dateFrom,dateTo){const now=new Date(),today=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,start=dateFrom||`${today.slice(0,7)}-01`,end=dateTo||today;if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw new Error('Format tanggal harus YYYY-MM-DD.');if(start>end)throw new Error('Date From tidak boleh lebih besar dari Date To.');return{start,end}}

export function buildPreventiveDashboard(source,dateFrom,dateTo,nop,siteId,search){
  const bounds=dateBounds(dateFrom,dateTo),dedupe={}
  for(const row of source)if(row.schedule_date>=bounds.start&&row.schedule_date<=bounds.end)dedupe[`${String(row.site_id).toLowerCase()}|${row.schedule_date}`]=row
  const eligible=Object.values(dedupe),sort=(a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}),nopOptions=[...new Set(eligible.map(x=>x.nop||'Belum ditentukan'))].sort(sort)
  let filtered=eligible.filter(row=>!nop||row.nop===nop),siteOptions=[...new Set(filtered.map(x=>x.site_id).filter(Boolean))].sort(sort)
  if(siteId)filtered=filtered.filter(row=>row.site_id===siteId);const q=String(search||'').trim().toLowerCase();if(q)filtered=filtered.filter(row=>['site_id','site_name','nop','notes'].map(k=>row[k]||'').join(' ').toLowerCase().includes(q))
  const unique={};for(const row of [...filtered].sort((a,b)=>(a.schedule_date||'').localeCompare(b.schedule_date||'')||(a.submitted_date||'').localeCompare(b.submitted_date||''))){const key=String(row.site_id).toLowerCase();if(!unique[key]||row.actual_date||!unique[key].actual_date)unique[key]=row}
  const rows=Object.values(unique).sort((a,b)=>sort(`${a.nop}|${a.site_id}`,`${b.nop}|${b.site_id}`)),planIds=new Set(filtered.map(x=>String(x.site_id).toLowerCase())),actualIds=new Set(filtered.filter(x=>x.actual_date).map(x=>String(x.site_id).toLowerCase()))
  const nopSummary=[...new Set(filtered.map(x=>x.nop||'Belum ditentukan'))].sort(sort).map(name=>{const group=filtered.filter(x=>(x.nop||'Belum ditentukan')===name),plan=new Set(group.map(x=>String(x.site_id).toLowerCase())).size,actual=new Set(group.filter(x=>x.actual_date).map(x=>String(x.site_id).toLowerCase())).size;return{nop:name,plan,actual,achievement:plan?Math.round(actual/plan*10000)/100:0}})
  return{period_start:bounds.start,period_end:bounds.end,plan:planIds.size,actual:actualIds.size,achievement:planIds.size?Math.round(actualIds.size/planIds.size*10000)/100:0,pending:Math.max(planIds.size-actualIds.size,0),nop_options:nopOptions,site_options:siteOptions,nop_summary:nopSummary,rows}
}
