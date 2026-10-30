import fs from 'node:fs/promises'
import path from 'node:path'
import {DATA_DIR,SERVER_DIR} from './config.js'
import {databaseEnabled,getPool} from './db.js'

const SEED_FILE=path.join(SERVER_DIR,'data','sumbagsel-improvement-seed.json')
const LOCAL_FILE=path.join(DATA_DIR,'sumbagsel-improvement-updates.json')
const text=value=>String(value??'').trim()
const upper=value=>text(value).toUpperCase()
const canonicalNop=value=>upper(value).replace(/^NOP\s*/,'').trim()
const fields=['responsibility','pic_team_lapangan','status','remark_progress','plan_date','done_date','problem_dependency','evidence_link','program','detail_program_activity','activity_program','category_program','rc_tier_1','tp','rca','po_htde_2026','po_upgrade_daya_2026']
// Close Activity/Close Validasi are produced only by Approval Activity. The
// Edit form manages the three operational statuses below.
const allowedStatuses=['Open','Submitted Update','Escalated']
const importedStatuses=[...allowedStatuses,'Close Activity (ENOM)','Close Validasi (NOP)']
const fixedFilterOptions={
 responsibility:['ENOM','ENOM + TSEL','PLN','SPMS','TELKOM','TP','TSEL'],
 problem_dependency:['Commcase / Access Issue','Need Budget - TSEL MBA','Need Budget - TSEL NOS','No Dependency','None / Clear','Responsible PLN','Responsible Telkom','Responsible TP','Waiting Material']
}
let seedCache
async function seed(){if(!seedCache)seedCache=JSON.parse(await fs.readFile(SEED_FILE,'utf8'));return seedCache}
async function localUpdates(){try{return JSON.parse(await fs.readFile(LOCAL_FILE,'utf8'))}catch(error){if(error.code==='ENOENT')return {};throw error}}
async function updates(){
 if(!databaseEnabled)return localUpdates()
 const [rows]=await getPool().query('SELECT site_id,data FROM sumbagsel_improvement_updates')
 return Object.fromEntries(rows.map(row=>[row.site_id,typeof row.data==='string'?JSON.parse(row.data):row.data]))
}
function mergeSite(site,update){return {...site,...(update||{}),site_id:site.site_id,nop:canonicalNop(site.nop),priority_enhancement:site.priority_enhancement,program:text(update?.activity_program)||update?.program||site.program,rca:update?.rca??site.rca,site_flicker:site.site_flicker,action_cat:site.action_cat}}
const week=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(text(value)))return '';const d=new Date(`${value}T00:00:00Z`),jan4=new Date(Date.UTC(d.getUTCFullYear(),0,4)),week=1+Math.round(((d-jan4)/86400000-3+(jan4.getUTCDay()+6)%7)/7);return `Week ${week}`}
const csvHeader=value=>text(value).replace(/^\uFEFF/,'').toLowerCase().replace(/\s+/g,' ')
const activityHeaders={
 site_id:'site id',activity_program:'program',category_program:'category program',detail_program_activity:'detail program activity',
 rca:'rc category',rc_tier_1:'rc tier 1',responsibility:'responsibility',pic_team_lapangan:'pic team',tp:'tp',
 problem_dependency:'problem dependency',status:'status',plan_date:'date plan',done_date:'actual done',remark_progress:'remark',evidence_link:'evidence'
}
function parseCsv(buffer){
 const source=Buffer.isBuffer(buffer)?buffer.toString('utf8'):String(buffer||''), rows=[], row=[];let cell='',quoted=false
 for(let index=0;index<source.length;index++){
  const char=source[index],next=source[index+1]
  if(char==='"'&&quoted&&next==='"'){cell+='"';index++;continue}
  if(char==='"'){quoted=!quoted;continue}
  if(char===','&&!quoted){row.push(cell);cell='';continue}
  if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')index++;row.push(cell);if(row.some(value=>text(value))){rows.push([...row])}row.length=0;cell='';continue}
  cell+=char
 }
 row.push(cell);if(row.some(value=>text(value)))rows.push(row)
 if(rows.length<2)throw Object.assign(new Error('CSV activity tidak memiliki baris data.'),{status:422})
 const headers=rows.shift().map(csvHeader)
 return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,text(values[index])]))).filter(row=>Object.values(row).some(Boolean))
}
function parseActivityDate(value){
 const raw=text(value);if(!raw)return ''
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw
 const match=raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/),months={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12}
 if(!match)return ''
 const month=months[match[2].toLowerCase()];if(!month)return ''
 return `${match[3]}-${String(month).padStart(2,'0')}-${String(match[1]).padStart(2,'0')}`
}
const valueFrom=(row,key)=>text(row[activityHeaders[key]])
export async function improvementDashboard(query={}){
 const source=await seed(), saved=await updates(), filters=Object.fromEntries(['nop','priority_enhancement','responsibility','rca','action_cat','program','detail_program_activity','status','problem_dependency','po_htde_2026','po_upgrade_daya_2026'].map(key=>[key,text(query[key])])), search=text(query.search).toLowerCase()
 const allSites=source.sites.map(site=>mergeSite(site,saved[site.site_id]))
 let sites=[...allSites]
 for(const [key,value] of Object.entries(filters))if(value)sites=sites.filter(site=>upper(site[key])===upper(value))
 if(search)sites=sites.filter(site=>[site.site_id,site.site_name,site.nop,site.rca,site.program,site.detail_program_activity,site.pic_team_lapangan,site.responsibility,site.status,site.problem_dependency].some(value=>text(value).toLowerCase().includes(search)))
 const options={};for(const key of Object.keys(filters)){
  const values=key==='detail_program_activity'
   ? [...allSites.map(site=>site.detail_program_activity),...allSites.map(site=>site.activity_program),...allSites.map(site=>site.program)]
   : allSites.map(site=>site[key])
  options[key]=fixedFilterOptions[key]||[...new Set(values.map(text).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'))
 }
 const open=sites.filter(x=>x.status==='Open').length,closeActivity=sites.filter(x=>x.status==='Close Activity (ENOM)').length,closeValidasi=sites.filter(x=>x.status==='Close Validasi (NOP)').length
 const updated=sites.filter(site=>(Array.isArray(site.activity_history)&&site.activity_history.length>0)||Boolean(site.activity_imported_at)).length
 const summary={total:sites.length,open,submitted:sites.filter(x=>x.status==='Submitted Update').length,escalated:sites.filter(x=>x.status==='Escalated').length,close_activity:closeActivity,close_validasi:closeValidasi,updated,not_updated:sites.length-updated}
 const responsibilities=[...new Set([...fixedFilterOptions.responsibility,...allSites.map(site=>text(site.responsibility)).filter(Boolean),...(allSites.some(site=>!text(site.responsibility))?['Belum ditentukan']:[])])]
 const dependencyValues=[...new Set([...fixedFilterOptions.problem_dependency,...allSites.map(site=>text(site.problem_dependency)).filter(Boolean)])]
 const dependencyTotals=Object.fromEntries(dependencyValues.map(problemDependency=>[problemDependency,sites.filter(site=>(text(site.problem_dependency)||'Belum ditentukan')===problemDependency).length]))
 // Angka yang memang ada ditampilkan lebih dahulu, tanpa menghapus pilihan
 // dependency lain dari matriks.
 const dependencies=[...dependencyValues].sort((a,b)=>((dependencyTotals[b]||0)-(dependencyTotals[a]||0))||String(a).localeCompare(String(b),'id'))
 const responsibilityDependency={
  columns:dependencies,
  rows:responsibilities.map(responsibility=>{
   const counts=Object.fromEntries(dependencies.map(problemDependency=>[problemDependency,sites.filter(site=>(text(site.responsibility)||'Belum ditentukan')===responsibility&&(text(site.problem_dependency)||'Belum ditentukan')===problemDependency).length]))
   return {responsibility,counts,total:Object.values(counts).reduce((sum,count)=>sum+count,0)}
  }).filter(row=>row.total>0),
  totals:Object.fromEntries(dependencies.map(problemDependency=>[problemDependency,dependencyTotals[problemDependency]||0])),
  grand_total:sites.length
 }
 return {title:'Dashboard Improvement Sumbagsel',source:source.source,summary,responsibility_dependency:responsibilityDependency,filters,options,teams_by_nop:source.teams_by_nop,sites:sites.map(site=>({...site,pic_options:source.teams_by_nop[canonicalNop(site.nop)]||[],plan_week:week(site.plan_date),done_week:week(site.done_date)}))}
}
export async function importActivityProgressCsv(buffer,filename='activity-progress.csv'){
 const rows=parseCsv(buffer), source=await seed(), siteById=new Map(source.sites.map(site=>[upper(site.site_id),site])), existing=await updates(), nextUpdates={...existing}, seen=new Set(), unmatched=[]
 const required=['site_id','detail_program_activity','status']
 const missing=required.filter(key=>!rows[0]||!(activityHeaders[key] in rows[0]))
 if(missing.length)throw Object.assign(new Error(`Header CSV tidak lengkap: ${missing.map(key=>activityHeaders[key]).join(', ')}.`),{status:422})
 for(const row of rows){
  const siteId=upper(valueFrom(row,'site_id')), site=siteById.get(siteId)
  if(!site){if(unmatched.length<20)unmatched.push(valueFrom(row,'site_id'));continue}
  if(seen.has(siteId))continue
  seen.add(siteId)
  const previous=nextUpdates[site.site_id]||{}, imported={...previous}
  for(const key of ['activity_program','category_program','detail_program_activity','rca','rc_tier_1','responsibility','pic_team_lapangan','tp','problem_dependency','remark_progress','evidence_link']){
   const value=valueFrom(row,key);if(value)imported[key]=value
  }
  const status=valueFrom(row,'status');if(status&&importedStatuses.includes(status))imported.status=status
  const planDate=parseActivityDate(valueFrom(row,'plan_date')),doneDate=parseActivityDate(valueFrom(row,'done_date'))
  if(planDate)imported.plan_date=planDate
  if(doneDate)imported.done_date=doneDate
  imported.activity_imported_at=new Date().toISOString()
  imported.activity_import_filename=text(filename)
  nextUpdates[site.site_id]=imported
 }
 if(!seen.size)throw Object.assign(new Error(`Tidak ada Site ID CSV yang cocok dengan master Sumbagsel. Contoh yang tidak cocok: ${unmatched.slice(0,5).join(', ')||'-'}.`),{status:422})
 await persistBatch(nextUpdates)
 return {imported:seen.size,unmatched:rows.length-seen.size,unmatched_examples:unmatched,filename:text(filename),fields:['Detail Program Activity','Responsibility','PIC Team','Problem Dependency','Status','Date Plan','Actual Done','Remark','Evidence']}
}
export async function updateImprovement(siteId,body={}){
 const source=await seed(), site=source.sites.find(row=>row.site_id===siteId);if(!site)throw Object.assign(new Error('Site Improvement tidak ditemukan.'),{status:404})
 const existing=(await updates())[siteId]||{}, next={...existing}
 // Simpan snapshot sebelum edit pertama agar tombol revert tidak menghapus
 // hasil import Activity Progress yang telah ada sebelumnya.
 if(!Object.prototype.hasOwnProperty.call(existing,'edit_backup'))next.edit_backup={...existing}
 for(const key of fields)if(key in body)next[key]=text(body[key])
 if(next.status&&!allowedStatuses.includes(next.status))throw Object.assign(new Error('Status activity tidak valid.'),{status:422})
 const candidates=source.teams_by_nop[canonicalNop(site.nop)]||[]
 if(next.pic_team_lapangan&&!candidates.includes(next.pic_team_lapangan))throw Object.assign(new Error(`PIC harus berasal dari team NOP ${site.nop}.`),{status:422})
 next.activity_history=[...(existing.activity_history||[]),{type:'update',at:new Date().toISOString(),status:next.status||site.status,note:next.remark_progress||''}]
 await persist(siteId,next);return {site:mergeSite(site,next),plan_week:week(next.plan_date),done_week:week(next.done_date)}
}
export async function revertImprovementEdit(siteId){
 const source=await seed(),site=source.sites.find(row=>row.site_id===siteId);if(!site)throw Object.assign(new Error('Site Improvement tidak ditemukan.'),{status:404})
 const existing=(await updates())[siteId]||{},previous=Object.prototype.hasOwnProperty.call(existing,'edit_backup')?existing.edit_backup:{}
 await persist(siteId,previous)
 return {site:mergeSite(site,previous),plan_week:week(previous.plan_date),done_week:week(previous.done_date)}
}
export async function approveImprovement(siteId,body={}){
 const code=text(body.authorization_code);if(!code)throw Object.assign(new Error('Kode otorisasi wajib diisi.'),{status:422})
 const configured=text(process.env.IMPROVEMENT_APPROVAL_PASSWORD);if(configured&&code!==configured)throw Object.assign(new Error('Kode otorisasi tidak sesuai.'),{status:403})
 const source=await seed(), site=source.sites.find(row=>row.site_id===siteId);if(!site)throw Object.assign(new Error('Site Improvement tidak ditemukan.'),{status:404})
 const existing=(await updates())[siteId]||{}, role=text(body.verifier_role)||'NOP Lead (Approval -> Close Activity (ENOM))', decision=text(body.decision)||'approve'
 const decisionMap={approve:{action:role.startsWith('NOP Lead')?'Close Activity (ENOM)':'Close Validasi (NOP)',status:role.startsWith('NOP Lead')?'Close Activity (ENOM)':'Close Validasi (NOP)'},return_open:{action:'Reject (Return to Open)',status:'Open'},set_escalated:{action:'Set Escalated',status:'Escalated'}}
 if(!decisionMap[decision])throw Object.assign(new Error('Aksi approval tidak valid.'),{status:422})
 const result=decisionMap[decision], next={...existing,status:result.status,responsibility:text(body.responsibility)||existing.responsibility||'',problem_dependency:text(body.problem_dependency)||existing.problem_dependency||'No Dependency',activity_history:[...(existing.activity_history||[]),{type:'approval',at:new Date().toISOString(),role:text(body.verifier_role)||'NOP Lead',action:result.action,status:result.status,note:text(body.approval_note)}]}
 await persist(siteId,next);return {site:mergeSite(site,next),plan_week:week(next.plan_date),done_week:week(next.done_date)}
}
async function persist(siteId,data){
 if(databaseEnabled){await getPool().query('INSERT INTO sumbagsel_improvement_updates(site_id,data) VALUES(?,?) ON DUPLICATE KEY UPDATE data=VALUES(data),updated_at=CURRENT_TIMESTAMP',[siteId,JSON.stringify(data)]);return}
 const all=await localUpdates();all[siteId]=data;await fs.mkdir(DATA_DIR,{recursive:true});await fs.writeFile(LOCAL_FILE+'.tmp',JSON.stringify(all),'utf8');await fs.rename(LOCAL_FILE+'.tmp',LOCAL_FILE)
}
async function persistBatch(all){
 if(databaseEnabled){
  const connection=await getPool().getConnection()
  try{await connection.beginTransaction();for(const entries of chunk(Object.entries(all),100))await connection.query('INSERT INTO sumbagsel_improvement_updates(site_id,data) VALUES ? ON DUPLICATE KEY UPDATE data=VALUES(data),updated_at=CURRENT_TIMESTAMP',[entries.map(([siteId,data])=>[siteId,JSON.stringify(data)])]);await connection.commit()}catch(error){await connection.rollback();throw error}finally{connection.release()}
  return
 }
 await fs.mkdir(DATA_DIR,{recursive:true});await fs.writeFile(LOCAL_FILE+'.tmp',JSON.stringify(all),'utf8');await fs.rename(LOCAL_FILE+'.tmp',LOCAL_FILE)
}
const chunk=(items,size)=>Array.from({length:Math.ceil(items.length/size)},(_item,index)=>items.slice(index*size,(index+1)*size))
