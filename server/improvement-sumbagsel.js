import fs from 'node:fs/promises'
import path from 'node:path'
import {DATA_DIR,SERVER_DIR} from './config.js'
import {databaseEnabled,getPool} from './db.js'

const SEED_FILE=path.join(SERVER_DIR,'data','sumbagsel-improvement-seed.json')
const LOCAL_FILE=path.join(DATA_DIR,'sumbagsel-improvement-updates.json')
const text=value=>String(value??'').trim()
const upper=value=>text(value).toUpperCase()
const canonicalNop=value=>upper(value).replace(/^NOP\s*/,'').trim()
const fields=['responsibility','pic_team_lapangan','status','remark_progress','plan_date','done_date','problem_dependency','evidence_link','program']
const allowedStatuses=['Open','In Progress','Submitted Update','Approved','Closed','Need Follow Up']
let seedCache
async function seed(){if(!seedCache)seedCache=JSON.parse(await fs.readFile(SEED_FILE,'utf8'));return seedCache}
async function localUpdates(){try{return JSON.parse(await fs.readFile(LOCAL_FILE,'utf8'))}catch(error){if(error.code==='ENOENT')return {};throw error}}
async function updates(){
 if(!databaseEnabled)return localUpdates()
 const [rows]=await getPool().query('SELECT site_id,data FROM sumbagsel_improvement_updates')
 return Object.fromEntries(rows.map(row=>[row.site_id,typeof row.data==='string'?JSON.parse(row.data):row.data]))
}
function mergeSite(site,update){return {...site,...(update||{}),site_id:site.site_id,nop:canonicalNop(site.nop),priority_enhancement:site.priority_enhancement,rca:site.rca,site_flicker:site.site_flicker,action_cat:site.action_cat,po_htde_2026:site.po_htde_2026,po_upgrade_daya_2026:site.po_upgrade_daya_2026}}
const week=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(text(value)))return '';const d=new Date(`${value}T00:00:00Z`),jan4=new Date(Date.UTC(d.getUTCFullYear(),0,4)),week=1+Math.round(((d-jan4)/86400000-3+(jan4.getUTCDay()+6)%7)/7);return `Week ${week}`}
export async function improvementDashboard(query={}){
 const source=await seed(), saved=await updates(), filters=Object.fromEntries(['nop','priority_enhancement','responsibility','site_flicker','rca','action_cat','program','status'].map(key=>[key,text(query[key])]))
 let sites=source.sites.map(site=>mergeSite(site,saved[site.site_id]))
 for(const [key,value] of Object.entries(filters))if(value)sites=sites.filter(site=>upper(site[key])===upper(value))
 const options={};for(const key of Object.keys(filters))options[key]=[...new Set(source.sites.map(site=>key==='responsibility'?(saved[site.site_id]?.responsibility||site.responsibility):site[key]).map(text).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'))
 const summary={total:sites.length,open:sites.filter(x=>x.status==='Open').length,in_progress:sites.filter(x=>x.status==='In Progress').length,submitted:sites.filter(x=>x.status==='Submitted Update').length,closed:sites.filter(x=>x.status==='Closed').length}
 return {title:'Dashboard Improvement Sumbagsel',source:source.source,summary,filters,options,teams_by_nop:source.teams_by_nop,sites:sites.map(site=>({...site,pic_options:source.teams_by_nop[canonicalNop(site.nop)]||[],plan_week:week(site.plan_date),done_week:week(site.done_date)}))}
}
export async function updateImprovement(siteId,body={}){
 const source=await seed(), site=source.sites.find(row=>row.site_id===siteId);if(!site)throw Object.assign(new Error('Site Improvement tidak ditemukan.'),{status:404})
 const existing=(await updates())[siteId]||{}, next={...existing}
 for(const key of fields)if(key in body)next[key]=text(body[key])
 if(next.status&&!allowedStatuses.includes(next.status))throw Object.assign(new Error('Status activity tidak valid.'),{status:422})
 const candidates=source.teams_by_nop[canonicalNop(site.nop)]||[]
 if(next.pic_team_lapangan&&!candidates.includes(next.pic_team_lapangan))throw Object.assign(new Error(`PIC harus berasal dari team NOP ${site.nop}.`),{status:422})
 next.activity_history=[...(existing.activity_history||[]),{type:'update',at:new Date().toISOString(),status:next.status||site.status,note:next.remark_progress||''}]
 await persist(siteId,next);return {site:mergeSite(site,next),plan_week:week(next.plan_date),done_week:week(next.done_date)}
}
export async function approveImprovement(siteId,body={}){
 const code=text(body.authorization_code);if(!code)throw Object.assign(new Error('Kode otorisasi wajib diisi.'),{status:422})
 const configured=text(process.env.IMPROVEMENT_APPROVAL_PASSWORD);if(configured&&code!==configured)throw Object.assign(new Error('Kode otorisasi tidak sesuai.'),{status:403})
 const source=await seed(), site=source.sites.find(row=>row.site_id===siteId);if(!site)throw Object.assign(new Error('Site Improvement tidak ditemukan.'),{status:404})
 const existing=(await updates())[siteId]||{}, role=text(body.verifier_role)||'NOP Lead (Approval -> Close Activity (ENOM))', action=role.startsWith('NOP Lead')?'Close Activity (ENOM)':'Close Validasi (NOP)', status=role.startsWith('NOP Lead')?'Closed':'Approved'
 const next={...existing,status,responsibility:text(body.responsibility)||existing.responsibility||'',problem_dependency:text(body.problem_dependency)||existing.problem_dependency||'No Dependency',activity_history:[...(existing.activity_history||[]),{type:'approval',at:new Date().toISOString(),role:text(body.verifier_role)||'NOP Lead',action,status,note:text(body.approval_note)}]}
 await persist(siteId,next);return {site:mergeSite(site,next),plan_week:week(next.plan_date),done_week:week(next.done_date)}
}
async function persist(siteId,data){
 if(databaseEnabled){await getPool().query('INSERT INTO sumbagsel_improvement_updates(site_id,data) VALUES(?,?) ON DUPLICATE KEY UPDATE data=VALUES(data),updated_at=CURRENT_TIMESTAMP',[siteId,JSON.stringify(data)]);return}
 const all=await localUpdates();all[siteId]=data;await fs.mkdir(DATA_DIR,{recursive:true});await fs.writeFile(LOCAL_FILE+'.tmp',JSON.stringify(all),'utf8');await fs.rename(LOCAL_FILE+'.tmp',LOCAL_FILE)
}