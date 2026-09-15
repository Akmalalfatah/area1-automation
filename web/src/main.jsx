const React = window.React
const ReactDOM = window.ReactDOM

const ICON_PATHS = {
  Activity: ['<path d="M3 12h4l2-7 4 14 2-7h6"/>'],
  BarChart3: ['<path d="M3 3v18h18"/>','<path d="M7 16v-4M12 16V8M17 16V5"/>'],
  CalendarDays: ['<rect x="3" y="5" width="18" height="16"/>','<path d="M16 3v4M8 3v4M3 10h18"/>'],
  Check: ['<path d="m5 12 4 4L19 6"/>'],
  ChevronRight: ['<path d="m9 18 6-6-6-6"/>'],
  Clipboard: ['<rect x="8" y="8" width="12" height="12"/>','<path d="M16 8V4H4v12h4"/>'],
  Download: ['<path d="M12 3v12"/>','<path d="m7 10 5 5 5-5"/>','<path d="M5 21h14"/>'],
  FileSpreadsheet: ['<rect x="3" y="3" width="18" height="18"/>','<path d="M8 3v18M3 9h18M3 15h18"/>'],
  Filter: ['<path d="M4 5h16l-6 7v5l-4 2v-7z"/>'],
  RefreshCw: ['<path d="M20 6v5h-5"/>','<path d="M4 18v-5h5"/>','<path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/>'],
  Settings2: ['<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/>','<circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>'],
  Share2: ['<circle cx="18" cy="5" r="3"/>','<circle cx="6" cy="12" r="3"/>','<circle cx="18" cy="19" r="3"/>','<path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>'],
  Trash2: ['<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>'],
  TrendingDown: ['<path d="m3 7 6 6 4-4 8 8"/>','<path d="M15 17h6v-6"/>'],
  TrendingUp: ['<path d="m3 17 6-6 4 4 8-8"/>','<path d="M15 7h6v6"/>'],
  Upload: ['<path d="M12 16V4"/>','<path d="m7 9 5-5 5 5"/>','<path d="M5 20h14"/>'],
  X: ['<path d="M6 6l12 12M18 6 6 18"/>']
}

function SvgIcon({name,size=16,className=''}) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" dangerouslySetInnerHTML={{__html:(ICON_PATHS[name]||[]).join('')}} />
}

const Activity=(p)=><SvgIcon name="Activity" {...p}/>
const BarChart3=(p)=><SvgIcon name="BarChart3" {...p}/>
const CalendarDays=(p)=><SvgIcon name="CalendarDays" {...p}/>
const Check=(p)=><SvgIcon name="Check" {...p}/>
const ChevronRight=(p)=><SvgIcon name="ChevronRight" {...p}/>
const Clipboard=(p)=><SvgIcon name="Clipboard" {...p}/>
const Download=(p)=><SvgIcon name="Download" {...p}/>
const FileSpreadsheet=(p)=><SvgIcon name="FileSpreadsheet" {...p}/>
const Filter=(p)=><SvgIcon name="Filter" {...p}/>
const RefreshCw=(p)=><SvgIcon name="RefreshCw" {...p}/>
const Settings2=(p)=><SvgIcon name="Settings2" {...p}/>
const Share2=(p)=><SvgIcon name="Share2" {...p}/>
const Trash2=(p)=><SvgIcon name="Trash2" {...p}/>
const TrendingDown=(p)=><SvgIcon name="TrendingDown" {...p}/>
const TrendingUp=(p)=><SvgIcon name="TrendingUp" {...p}/>
const Upload=(p)=><SvgIcon name="Upload" {...p}/>
const X=(p)=><SvgIcon name="X" {...p}/>

const RUN_KEY = 'kpi-a1-run-id'
const PROMPT_KEY = 'kpi-a1-custom-prompt-single-period'
const CATEGORY_COLORS = { IS: '#92D050', BS: '#00B050', B: '#00B0F0', C: '#FFC000', K: '#C00000' }
const SCALE = { min: [248,105,107], mid: [255,235,132], max: [99,190,123] }

async function api(url, options) {
  const response = await fetch(url, options)
  if (response.ok) return response.json()
  let message = `Request gagal (${response.status})`
  try { message = (await response.json()).detail || message } catch {}
  throw new Error(message)
}

const getConfig = () => api('/api/config')
const createRun = () => api('/api/runs', { method: 'POST' })
const getRun = (id) => api(`/api/runs/${id}`)
const getDashboard = (id, region = '', nop = '') => {
  const params = new URLSearchParams()
  if (region) params.set('region', region)
  if (nop) params.set('nop', nop)
  return api(`/api/runs/${id}/dashboard${params.size ? `?${params}` : ''}`)
}
const getHistory = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.day) params.set('day', filters.day)
  if (filters.month) params.set('month', filters.month)
  if (filters.year) params.set('year', filters.year)
  return api(`/api/history${params.size ? `?${params}` : ''}`)
}
async function getKpiExport(id, region = '', nop = '') {
  const params = new URLSearchParams()
  if (region) params.set('region', region)
  if (nop) params.set('nop', nop)
  const response = await fetch(`/api/runs/${id}/export.xlsx${params.size ? `?${params}` : ''}`)
  if (!response.ok) {
    let message = `Export gagal (${response.status})`
    try { message = (await response.json()).detail || message } catch {}
    throw new Error(message)
  }
  const disposition = response.headers.get('content-disposition') || ''
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `kpi-${id}.xlsx`
  return { blob: await response.blob(), filename }
}
const generateReport = (id, prompt, region = '', nop = '') => api(`/api/runs/${id}/report`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, region: region || null, nop: nop || null })
})
async function uploadKpi(id, file, date) {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_date', date)
  return api(`/api/runs/${id}/upload`, { method: 'POST', body: form })
}
const getPreventiveDashboard = (filters = {}, maintenanceType = '') => {
  const params = new URLSearchParams()
  if(filters.dateFrom)params.set('date_from',filters.dateFrom)
  if(filters.dateTo)params.set('date_to',filters.dateTo)
  if(filters.nop)params.set('nop',filters.nop)
  if(filters.siteId)params.set('site_id',filters.siteId)
  if(filters.search)params.set('search',filters.search)
  if(filters.status)params.set('status',filters.status)
  if(filters.pic)params.set('pic',filters.pic)
  if(filters.interval)params.set('interval',filters.interval)
  if(filters.typePower)params.set('type_power',filters.typePower)
  if(filters.scopeItem)params.set('scope_item',filters.scopeItem)
  if(filters.scheduleState)params.set('schedule_state',filters.scheduleState)
  if(maintenanceType)params.set('maintenance_type',maintenanceType)
  return api(`/api/preventive/dashboard${params.size?`?${params}`:''}`)
}
async function uploadPreventive(file,date){
  const form=new FormData()
  form.append('file',file)
  form.append('upload_date',date)
  return api('/api/preventive/upload',{method:'POST',body:form})
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value))
}
function formatWeight(value) {
  if (value === null || value === undefined) return ''
  return Number.isInteger(Number(value)) ? String(Number(value)) : String(value).replace('.', ',')
}
function shortDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}
function shortDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}
function excelDateLabel(value) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
  return `${month}-${String(date.getDate()).padStart(2,'0')}`
}
function compactNop(value) { return String(value || '').replace(/^NOP\s+/i, '') }
function deltaText(value) { return `${Number(value) >= 0 ? '+' : ''}${formatNumber(value)}` }
function median(values) {
  const sorted = [...values].sort((a,b)=>a-b)
  if (!sorted.length) return 0
  const m=Math.floor(sorted.length/2)
  return sorted.length%2 ? sorted[m] : (sorted[m-1]+sorted[m])/2
}
function mix(a,b,t){return a.map((v,i)=>Math.round(v+(b[i]-v)*t))}
function rgb(v){return `rgb(${v[0]},${v[1]},${v[2]})`}
function heatColor(value, values) {
  const numeric=values.filter((v)=>typeof v==='number'&&Number.isFinite(v))
  if(typeof value!=='number'||!numeric.length)return '#fff'
  const min=Math.min(...numeric),max=Math.max(...numeric),mid=median(numeric)
  if(max===min)return rgb(SCALE.mid)
  if(value<=mid)return rgb(mix(SCALE.min,SCALE.mid,mid===min?1:(value-min)/(mid-min)))
  return rgb(mix(SCALE.mid,SCALE.max,max===mid?1:(value-mid)/(max-mid)))
}
function todayIso() {
  const d = new Date()
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
function currentMonthIso(){return todayIso().slice(0,7)}
function firstDayOfCurrentMonth(){return `${currentMonthIso()}-01`}
function monthLabel(value){
  if(!value)return '-'
  const [year,month]=value.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(new Date(year,month-1,1))
}
function inferDateFromFilename(name) {
  const raw=String(name||'')
  let match=raw.match(/(20\d{2})(0[1-9]|1[0-2])([0-2]\d|3[01])/) 
  if(match)return `${match[1]}-${match[2]}-${match[3]}`
  match=raw.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_]([0-2]\d|3[01])/) 
  if(match)return `${match[1]}-${match[2]}-${match[3]}`
  return todayIso()
}

function mergeRangeDashboards(dashboards) {
  const latest=dashboards[dashboards.length-1]
  if(!latest)return null
  const nops=dashboards.flatMap((dashboard,dashboardIndex)=>dashboard.dataset.nops.map((item,itemIndex)=>({
    ...item, date:dashboard.dataset.date, entryKey:`${dashboard.dataset.date}-${item.name}-${dashboardIndex}-${itemIndex}`
  })))
  return {...latest,dataset:{...latest.dataset,nops}}
}


function Sidebar({activePage,preventiveOpen,onPage,onTogglePreventive}) {
  return <aside className="sidebar-shell fixed left-0 top-0 z-40 h-screen w-[250px] text-white">
    <div className="h-[16px] border-b border-white/10" />
    <nav className="py-2">
      <button onClick={()=>onPage('ekpi')} className={`sidebar-nav-button flex h-[48px] w-full items-center gap-3 px-6 text-left text-xs font-semibold ${activePage==='ekpi'?'is-active':''}`}>
        <BarChart3 size={15}/>
        <span>eKPI Automation</span>
      </button>
      <a href="https://simulatorkpi.3e-sumatera.com/" target="_blank" rel="noreferrer" className="sidebar-nav-button flex h-[48px] w-full items-center gap-3 px-6 text-left text-xs font-semibold">
        <Activity size={15}/>
        <span>Simulator Recon KPI</span>
      </a>
      <button onClick={onTogglePreventive} aria-expanded={preventiveOpen} className={`sidebar-nav-button mt-1 flex h-[48px] w-full items-center gap-3 px-6 text-left text-xs font-semibold ${activePage.startsWith('preventive')?'is-active':''}`}>
        <ChevronRight size={15} className={`sidebar-arrow ${preventiveOpen?'is-open':''}`}/>
        <span>Preventive Management</span>
      </button>
      {preventiveOpen&&<div className="sidebar-subnav py-1">
        <button onClick={()=>onPage('preventive-dashboard')} className={`sidebar-nav-button flex h-[46px] w-full items-center gap-3 pl-11 pr-5 text-left text-xs font-semibold ${activePage==='preventive-dashboard'?'is-active':''}`}><span>Dashboard</span></button>
        <button onClick={()=>onPage('preventive-genset')} className={`sidebar-nav-button flex h-[46px] w-full items-center gap-3 pl-11 pr-5 text-left text-xs font-semibold ${activePage==='preventive-genset'?'is-active':''}`}><span>PM Genset</span></button>
        <button onClick={()=>onPage('preventive-site')} className={`sidebar-nav-button flex h-[46px] w-full items-center gap-3 pl-11 pr-5 text-left text-xs font-semibold ${activePage==='preventive-site'?'is-active':''}`}><span>PM Site</span></button>
      </div>}
    </nav>
  </aside>
}

function PreventiveUploadPanel({file,date,busy,latest,onFile,onDate,onUpload}){
  const display=file?{filename:file.name,upload_date:date,row_count:null}:latest
  return <section className="corporate-panel p-5">
    <div className="grid grid-cols-[1fr_270px] gap-5">
      <div>
        <div className="flex min-h-[72px] items-center border border-[#D8E0EA] bg-[#F7F9FC] px-3">
          <div className="icon-box mr-3 flex h-10 w-10 items-center justify-center bg-[#087D4B] text-[10px] font-semibold text-white">XLS</div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-[11px] font-semibold text-[#26384F]">{display?.filename||'Belum ada file preventive dipilih'}</p>{display&&<span className="status-ready">Ready</span>}</div><p className="mt-1 text-[10px] text-slate-400">{display?`${shortDate(display.upload_date)}${display.row_count?` · ${display.row_count} baris`:''}`:'Pilih file jadwal preventive untuk diperbarui'}</p></div>
          {display&&<Check size={16} className="text-[#0C8A5B]"/>}
        </div>
        <label className="mt-3 grid h-[42px] cursor-pointer grid-cols-[110px_1fr] border border-[#D8E0EA] bg-white"><span className="flex items-center justify-center border-r border-[#D8E0EA] bg-[#E9EEF4] text-[10px] font-semibold text-[#26384F]">Choose File</span><span className="flex min-w-0 items-center px-3 text-[10px] text-slate-400"><span className="truncate">{file?.name||'Select preventive Excel file...'}</span></span><input type="file" accept=".xlsx" onChange={e=>{const selected=e.target.files?.[0]||null;onFile(selected);if(selected)onDate(inferDateFromFilename(selected.name))}} className="hidden"/></label>
        <p className="mt-1 text-right text-[9px] text-slate-400">Format: .xlsx</p>
      </div>
      <div className="flex flex-col justify-end"><label className="filter-label mb-1 block">UPLOAD DATE</label><input type="date" value={date||''} onChange={e=>onDate(e.target.value)} className="control h-[42px] w-full px-3 text-[10px] font-semibold"/><button disabled={!file||!date||busy} onClick={onUpload} className="btn-primary mt-3 flex h-[42px] items-center justify-center gap-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40">{busy?<RefreshCw size={14} className="animate-spin"/>:<Upload size={14}/>} {busy?'UPLOADING...':'UPLOAD FILE'}</button></div>
    </div>
  </section>
}

function PreventiveSummaryCard({label,value,detail,tone}){
  const colors={navy:'#173E68',green:'#0B8A5B',orange:'#E27B2B',red:'#D64B55'}
  return <div className="corporate-panel min-h-[130px] border-t-[7px] p-4" style={{borderTopColor:colors[tone]||colors.navy}}><p className="text-[10px] font-semibold tracking-[.05em] text-[#607086]">{label}</p><p className="mt-4 text-[26px] font-semibold leading-none text-[#243A55]">{value}</p><p className="mt-3 text-[10px] text-slate-400">{detail}</p></div>
}

function RoutineMaintenanceFilters({data,filters,onFilter,type}){
  const isGenset=type==='genset'
  return <div className="preventive-filter-row">
    <div><label className="filter-label mb-1 block">DATE FROM</label><input type="date" value={filters.dateFrom} onChange={e=>onFilter('dateFrom',e.target.value)} className="control h-10 w-[155px] px-3 text-[10px] font-semibold"/></div>
    <div><label className="filter-label mb-1 block">DATE TO</label><input type="date" value={filters.dateTo} onChange={e=>onFilter('dateTo',e.target.value)} className="control h-10 w-[155px] px-3 text-[10px] font-semibold"/></div>
    <div><label className="filter-label mb-1 block">NOP</label><select value={filters.nop} onChange={e=>onFilter('nop',e.target.value)} className="control h-10 w-[170px] px-3 text-[10px] font-semibold"><option value="">All NOP</option>{(data?.nop_options||[]).map(x=><option key={x} value={x}>{compactNop(x)}</option>)}</select></div>
    <div><label className="filter-label mb-1 block">STATUS PM</label><select value={filters.status} onChange={e=>onFilter('status',e.target.value)} className="control h-10 w-[150px] px-3 text-[10px] font-semibold"><option value="">All Status</option>{(data?.status_options||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></div>
    <div><label className="filter-label mb-1 block">PIC</label><select value={filters.pic} onChange={e=>onFilter('pic',e.target.value)} className="control h-10 w-[160px] px-3 text-[10px] font-semibold"><option value="">All PIC</option>{(data?.pic_options||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></div>
    {isGenset?<><div><label className="filter-label mb-1 block">TYPE POWER</label><select value={filters.typePower} onChange={e=>onFilter('typePower',e.target.value)} className="control h-10 w-[180px] px-3 text-[10px] font-semibold"><option value="">All Type Power</option>{(data?.type_power_options||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></div><div><label className="filter-label mb-1 block">SCOPE ITEM</label><select value={filters.scopeItem} onChange={e=>onFilter('scopeItem',e.target.value)} className="control h-10 w-[210px] px-3 text-[10px] font-semibold"><option value="">All Scope Item</option>{(data?.scope_item_options||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></div></>:<><div><label className="filter-label mb-1 block">INTERVAL</label><select value={filters.interval} onChange={e=>onFilter('interval',e.target.value)} className="control h-10 w-[130px] px-3 text-[10px] font-semibold"><option value="">All Interval</option>{(data?.interval_options||[]).map(x=><option key={x} value={x}>{x}</option>)}</select></div><div><label className="filter-label mb-1 block">SCHEDULE STATE</label><select value={filters.scheduleState} onChange={e=>onFilter('scheduleState',e.target.value)} className="control h-10 w-[170px] px-3 text-[10px] font-semibold"><option value="">All Schedule</option><option value="overdue">Terlambat</option><option value="upcoming">Belum Jatuh Tempo</option><option value="submitted">Submitted</option></select></div></>}
  </div>
}

function PreventiveDashboard({data,file,date,busy,loading,filters,onFile,onDate,onUpload,onFilter,maintenanceType='',showUpload=true}){
  const rows=data?.rows||[]
  const visibleRows=rows.slice(0,100)
  const isGenset=maintenanceType==='genset'
  const isSite=maintenanceType==='site'
  const detailFields=row=>isGenset||isSite?[
    ['Schedule Date',shortDate(row.schedule_date)],['Submitted Date',shortDate(row.submitted_date)],['Status',row.status||'-'],['PIC',row.pic||'-']
  ]:[
    ['Schedule Date',shortDate(row.schedule_date)],['Submitted Date',shortDate(row.submitted_date)],['Status',row.status||'-'],
    ['Ticket No',row.ticket_no||'-'],['Regional',row.regional||'-'],['Cluster',row.cluster||'-'],['PIC',row.pic||'-'],
    ['Class Site',row.class_site||'-'],['Type Site',row.type_site||'-'],['Interval',row.interval||'-'],['Last Maintenance',shortDate(row.submitted_date)],
    ['Diff Days',row.diff_days||'-'],['Area',row.area||'-'],['Created Date',shortDate(row.created_date)]
  ]
  return <div className="space-y-4">
    {showUpload&&<PreventiveUploadPanel file={file} date={date} busy={busy} latest={data?.latest_upload} onFile={onFile} onDate={onDate} onUpload={onUpload}/>} 
    <div className="grid grid-cols-4 gap-4"><PreventiveSummaryCard label="PLAN SITE" value={data?.plan??0} detail={`${shortDate(filters.dateFrom)} sampai ${shortDate(filters.dateTo)}`} tone="navy"/><PreventiveSummaryCard label="SUBMITTED" value={data?.submitted??0} detail="Site unik dengan Submitted Date terisi" tone="green"/><PreventiveSummaryCard label="ACHIEVEMENT" value={`${formatNumber(data?.achievement??0)}%`} detail="Submitted dibanding Plan pada filter aktif" tone="orange"/><PreventiveSummaryCard label="BELUM SUBMIT" value={data?.pending??0} detail="Site plan yang belum memiliki Submitted Date" tone="red"/></div>
    <section className="corporate-panel p-5">
      {maintenanceType?<RoutineMaintenanceFilters data={data} filters={filters} onFilter={onFilter} type={maintenanceType}/>:<div className="preventive-filter-row">
        <div><label className="filter-label mb-1 block">DATE FROM</label><input type="date" value={filters.dateFrom} onChange={e=>onFilter('dateFrom',e.target.value)} className="control h-10 w-[155px] px-3 text-[10px] font-semibold"/></div>
        <div><label className="filter-label mb-1 block">DATE TO</label><input type="date" value={filters.dateTo} onChange={e=>onFilter('dateTo',e.target.value)} className="control h-10 w-[155px] px-3 text-[10px] font-semibold"/></div>
        <div><label className="filter-label mb-1 block">NOP</label><select value={filters.nop} onChange={e=>onFilter('nop',e.target.value)} className="control h-10 w-[180px] px-3 text-[10px] font-semibold"><option value="">All NOP</option>{(data?.nop_options||[]).map(item=><option key={item} value={item}>{compactNop(item)}</option>)}</select></div>
        <div><label className="filter-label mb-1 block">SITE ID</label><select value={filters.siteId} onChange={e=>onFilter('siteId',e.target.value)} className="control h-10 w-[170px] px-3 text-[10px] font-semibold"><option value="">All Site ID</option>{(data?.site_options||[]).map(item=><option key={item} value={item}>{item}</option>)}</select></div>
        <div className="preventive-filter-search"><label className="filter-label mb-1 block text-right">SEARCH</label><input type="search" value={filters.search} onChange={e=>onFilter('search',e.target.value)} placeholder="Cari Site ID, Site Name, NOP, atau Notes" className="control h-10 w-full px-3 text-[10px]"/></div>
      </div>}
      <div className="mt-4 flex items-center justify-between"><div><h2 className="section-title">{isGenset?'PM GENSET — GENERAL INFORMATION':isSite?'PM SITE — GENERAL INFORMATION':'GENERAL INFORMATION'}</h2><p className="mt-1 text-[10px] text-slate-400">Schedule {data?.period_start?shortDate(data.period_start):'-'} sampai {data?.period_end?shortDate(data.period_end):'-'} · Menampilkan {Math.min(rows.length,100)} dari {rows.length} site</p></div>{loading&&<RefreshCw size={15} className="animate-spin text-[#173E68]"/>}</div>
      <div className="kpi-scrollbar preventive-card-list">{visibleRows.length?visibleRows.map((row,index)=>{const key=`${row.site_id}-${row.schedule_date}-${row.ticket_no}-${index}`;return <details key={key} className="preventive-info-card"><summary className="preventive-card-head"><div className="preventive-card-section"><p className="preventive-card-label">SITE ID</p><p className="mt-1 text-[11px] font-semibold text-[#29496C]">{row.site_id}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">SITE NAME</p><p className="mt-1 truncate text-[11px] font-semibold text-[#34465C]">{row.site_name}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">NOP</p><p className="mt-1 text-[11px] font-semibold text-[#34465C]">{compactNop(row.nop)}</p></div><ChevronRight size={15} className="preventive-card-chevron"/></summary><div className="preventive-card-details"><div className="preventive-detail-grid">{detailFields(row).map(([label,value])=><div key={label}><p className="preventive-card-label">{label.toUpperCase()}</p>{label==='Status'?<span className={`preventive-status mt-1 ${row.submitted_date?'is-done':'is-pending'}`}>{value}</span>:<p className="mt-1 text-[10px] font-medium leading-4 text-[#42536A]">{value}</p>}</div>)}</div><div className="preventive-notes"><p className="preventive-card-label">NOTES</p><p title={row.notes||'-'} className="mt-1 cursor-help text-[10px] leading-5 text-[#42536A]">{row.notes||'-'}</p></div></div></details>}):<div className="flex h-[180px] items-center justify-center text-[10px] text-slate-400">Belum ada data preventive pada rentang tanggal dan filter ini.</div>}</div>
    </section>
  </div>
}

function PreventivePlaceholder({title}){return <section className="corporate-panel flex min-h-[360px] items-center justify-center p-8 text-center"><div><h2 className="section-title">{title.toUpperCase()}</h2><p className="mt-3 text-[11px] text-slate-400">Section ini sudah disiapkan pada navigasi dan dapat dilanjutkan setelah desain serta data Excel-nya ditentukan.</p></div></section>}

function UploadPanel({ run, draftFile, draftDate, busyUpload, setDraftFile, setDraftDate, onUpload }) {
  const uploaded=run?.upload
  const displayFile=draftFile ? { filename:draftFile.name, date:draftDate, valid:false } : uploaded
  const ready=Boolean(draftFile && draftDate)
  const chooseFile=(selected)=>{
    setDraftFile(selected)
    if(selected)setDraftDate(inferDateFromFilename(selected.name))
  }
  return <section className="corporate-panel flex h-full min-h-[285px] flex-col p-5">
    <div className="flex min-h-[72px] items-center border border-[#D8E0EA] bg-[#F7F9FC] px-3">
      <div className="icon-box mr-3 flex h-10 w-10 items-center justify-center bg-[#087D4B] text-[10px] font-semibold text-white">XLS</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[11px] font-semibold text-[#26384F]">{displayFile?.filename || 'Belum ada file KPI dipilih'}</p>
          {displayFile&&<span className="status-ready">Ready</span>}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">{displayFile ? `${displayFile.date ? shortDate(displayFile.date) : 'Tanggal otomatis'} · 1 file KPI` : 'Pilih satu file raw KPI untuk diproses'}</p>
      </div>
      {displayFile&&<Check size={16} className="text-[#0C8A5B]"/>}
    </div>
    <label className="mt-3 grid h-[42px] cursor-pointer grid-cols-[92px_1fr] border border-[#D8E0EA] bg-white">
      <span className="flex items-center justify-center border-r border-[#D8E0EA] bg-[#E9EEF4] text-[10px] font-semibold text-[#26384F]">Choose File</span>
      <span className="flex min-w-0 items-center px-3 text-[10px] text-slate-400"><span className="truncate">{draftFile?.name || 'Select RAW eKPI file...'}</span></span>
      <input type="file" accept=".xlsx" onChange={e=>chooseFile(e.target.files?.[0]||null)} className="hidden" />
    </label>
    <p className="mt-1 text-right text-[9px] text-slate-400">Format: .xlsx</p>
    <div className="mt-3 grid grid-cols-[92px_1fr] items-center gap-3">
      <label className="text-[10px] font-semibold tracking-[.04em] text-[#53657A]">UPLOAD DATE</label>
      <input aria-label="Tanggal data upload" type="date" value={draftDate||''} onChange={e=>setDraftDate(e.target.value)} className="control h-[38px] w-full px-3 text-[10px] font-semibold text-[#44556B]" />
    </div>
    <button disabled={!ready || busyUpload} onClick={onUpload} className="btn-primary mt-3 flex h-[42px] w-full items-center justify-center gap-2 text-[10px] font-semibold tracking-[.04em] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300">
      {busyUpload?<RefreshCw size={14} className="animate-spin"/>:<Upload size={14}/>} {busyUpload?'UPLOADING...':'UPLOAD FILE'}
    </button>
    <div className="flex-1"/>
  </section>
}

function HistoryPanel({ items, selectedRunId, selectedHistory, onToggleHistory, onSelectAllHistory, onDeleteHistory, deletingHistory, onSelectHistory, databaseEnabled, scope, onScope, dateValue, onDateFilter, deleteMode, onDeleteMode }) {
  const visibleItems=items.slice(0,5)
  const allSelected=visibleItems.length>0&&visibleItems.every(item=>selectedHistory.includes(item.run_id))
  return <section className="corporate-panel flex h-full min-h-[285px] flex-col p-5">
    <div className="flex items-center justify-end gap-2 border-b border-slate-200 pb-3">
      <select value={scope} onChange={e=>onScope(e.target.value)} className="control h-8 min-w-[130px] px-2 text-[10px] font-semibold text-[#44556B]">
        <option value="recent">All Recent</option>
        <option value="today">Today</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select><input aria-label="Filter KPI history berdasarkan tanggal" type="date" value={dateValue||''} onChange={e=>onDateFilter(e.target.value)} className="control h-8 w-[150px] px-2 text-[10px] font-semibold text-[#44556B]" />
      {deleteMode&&<label className="flex h-8 items-center gap-2 border border-[#CBD5E1] bg-white px-2 text-[10px] font-semibold text-[#52647A]"><input type="checkbox" checked={allSelected} onChange={e=>onSelectAllHistory(e.target.checked,visibleItems.map(item=>item.run_id))}/>All</label>}
      <button onClick={deleteMode&&selectedHistory.length?onDeleteHistory:onDeleteMode} className="icon-button flex h-8 items-center gap-1.5 border border-red-200 bg-white px-2 text-[10px] font-semibold text-red-600"><Trash2 size={13}/>{deleteMode?(selectedHistory.length?'Delete':'Cancel'):'Delete'}</button>
    </div>
    {!databaseEnabled ? <div className="mt-4 border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-700">History belum aktif pada konfigurasi saat ini.</div> : items.length ? <div className="mt-4 flex-1 space-y-1.5">{visibleItems.map((item)=>{
      const selected=selectedRunId===item.run_id
      const sites=item.history?.dataset?.nops?.length || item.history?.nop_count || 0
      return <div key={item.run_id} className={`grid min-h-[42px] w-full ${deleteMode?'grid-cols-[24px_1fr_auto]':'grid-cols-[1fr_auto]'} items-center border px-2.5 text-left ${selected?'border-[#AFC8E6] bg-[#EFF6FF]':'border-[#D9E1EB] bg-[#F9FBFD]'}`}>
        {deleteMode&&<input aria-label={`Pilih history ${shortDate(item.date_end)}`} type="checkbox" checked={selectedHistory.includes(item.run_id)} onChange={e=>onToggleHistory(item.run_id,e.target.checked)} />}
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${selected?'bg-[#1B5C9B]':'bg-[#A6B3C2]'}`}/>
          <p className="truncate text-[10px] font-semibold text-[#26384F]">{shortDate(item.date_end)}</p>
          <span className="truncate text-[9px] text-slate-400">{sites?`${sites} Sites · `:''}{item.updated_at?`Today ${shortDateTime(item.updated_at)}`:'Saved KPI'}</span>
        </div>
        <span role="button" tabIndex="0" onClick={()=>onSelectHistory(item.run_id)} className="cursor-pointer px-2 py-1 text-[9px] font-semibold text-[#173E68]">View</span>
      </div>
    })}</div> : <div className="mt-4 flex flex-1 items-center justify-center border border-dashed border-slate-300 text-[10px] text-slate-400">Belum ada KPI history.</div>}
  </section>
}

function FilterBar({ config, region, nop, rowGroup, onRegion, onNop, onRowGroup }) {
  const regions=config.regions
  const options=Object.entries(regions).flatMap(([regional,nops])=>nops.map(nopName=>({regional,nop:nopName}))).filter(item=>!region||item.regional===region)
  return <div className="border-b border-slate-200 pb-4">
    <div className="grid grid-cols-3 items-end gap-x-5 gap-y-3">
      <div className="flex items-center gap-3">
        <label className="filter-label">REGIONAL:</label>
        <select value={region} onChange={e=>onRegion(e.target.value)} className="control h-9 min-w-[180px] flex-1 px-3 text-[10px] font-semibold">
          <option value="">All Regional</option>
          {Object.keys(regions).map(r=><option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label className="filter-label">NOP:</label>
        <select value={nop} onChange={e=>onNop(e.target.value)} className="control h-9 min-w-[180px] flex-1 px-3 text-[10px] font-semibold">
          <option value="">All NOP Cluster</option>
          {options.map(item=><option key={`${item.regional}-${item.nop}`} value={item.nop}>{compactNop(item.nop)}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label className="filter-label">CATEGORY:</label>
        <select value={rowGroup} onChange={e=>onRowGroup(e.target.value)} className="control h-9 flex-1 px-3 text-[10px] font-semibold">
          <option value="">All Parameters (A &amp; B)</option>
          <option value="A">A. Availability Site NE Base Aggregate Cell</option>
          <option value="B">B. Ticketing Activity &amp; Alarm Handling</option>
        </select>
      </div>
    </div>
  </div>
}

function KpiTable({ dashboard, region, nop, rowGroup, tableRef }) {
  const dataset=dashboard.dataset
  const nops=dataset.nops.filter(item=>(!region||item.region===region)&&(!nop||item.name===nop)).sort((a,b)=>{
    const byName=String(a.name).localeCompare(String(b.name))
    return byName||String(a.date||dataset.date).localeCompare(String(b.date||dataset.date))
  })
  const nopGroups=nops.reduce((groups,item)=>{
    const existing=groups.find(group=>group.name===item.name)
    if(existing)existing.items.push(item)
    else groups.push({name:item.name,items:[item]})
    return groups
  },[])
  const rows=dataset.rows.filter(row=>{
    if(!rowGroup)return true
    if(row.type==='score'||row.type==='category')return true
    return row.key===rowGroup||row.key.startsWith(`${rowGroup}_`)
  })
  const rowValues=Object.fromEntries(rows.map(row=>[row.key,nops.map(n=>n.values[row.key]).filter(v=>typeof v==='number')]))
  return <div ref={tableRef} className="kpi-capture min-w-0 max-w-full overflow-hidden bg-white">
    <div className="kpi-scrollbar max-h-[720px] max-w-full overflow-x-auto overflow-y-auto border border-[#C9D3DF]">
      <table className="kpi-table border-collapse text-[10px] text-[#26384F]">
        <thead className="sticky top-0 z-20">
          <tr>
            <th rowSpan={2} className="sticky left-0 z-40 min-w-[390px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-left font-semibold text-white">Skor KPI</th>
            <th rowSpan={2} className="sticky left-[390px] z-40 min-w-[78px] border-b border-r border-[#102C4D] bg-[#1D426E] px-2 py-3 text-center font-semibold text-white">Bobot</th>
            {nopGroups.map(group=><th key={group.name} colSpan={group.items.length} className="min-w-[110px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-center font-semibold text-white">{group.name}</th>)}
          </tr>
          <tr>{nops.map(n=><th key={`${n.entryKey||n.name}-${n.date||dataset.date}`} className="min-w-[110px] border-b border-r border-[#102C4D] bg-[#1D426E] px-2 py-2 text-center font-semibold text-white">{excelDateLabel(n.date||dataset.date)}</th>)}</tr>
        </thead>
        <tbody>{rows.map(row=>{
          const aggregate=row.type==='aggregate', score=row.type==='score', categoryRow=row.type==='category'
          return <tr key={row.key} className={aggregate?'font-semibold':''}>
            <td className={`sticky left-0 z-10 border-b border-r border-[#C6D0DC] px-3 py-2 text-left ${score||categoryRow?'bg-[#1D426E] font-semibold text-white':aggregate?'bg-[#E8EDF2]':'bg-white'} ${categoryRow?'kpi-category-cell':''}`}>{row.label}</td>
            <td className={`${categoryRow?'kpi-category-cell':'kpi-numeric-cell'} sticky left-[390px] z-10 border-b border-r border-[#C6D0DC] px-2 py-2 text-center ${score||categoryRow?'bg-[#1D426E] text-white':aggregate?'bg-[#E8EDF2]':'bg-white'}`}>{row.key==='kpi_score'?'100%':formatWeight(row.weight)}</td>
            {nops.map(n=>{
              const raw=n.values[row.key]
              let bg='#fff',color='#26384F'
              if(categoryRow){bg=CATEGORY_COLORS[String(raw||'')]||'#fff';color='#fff'}
              else if(score){bg=CATEGORY_COLORS[n.values.category]||'#fff';color='#fff'}
              else if(aggregate){bg='#E8EDF2';color='#334155'}
              else if(row.type==='component'){bg=Number(row.weight)===3.75&&Number(raw)>=3.75?'#63BE7B':heatColor(raw,rowValues[row.key])}
              return <td key={`${n.entryKey||n.name}-${row.key}`} style={{background:bg,color}} className={`border-b border-r border-[#C6D0DC] px-2 py-2 text-center tabular-nums ${categoryRow?'kpi-category-cell':'kpi-numeric-cell'}`}>{categoryRow?(raw||''):formatNumber(raw)}</td>
            })}
          </tr>
        })}</tbody>
      </table>
    </div>
  </div>
}

function KpiWorkspace({ config, dashboard, region, nop, rowGroup, onRegion, onNop, onRowGroup, rangeStart, rangeEnd, rangeLoading, onRangeDate, onClearRange, tableRef }) {
  return <section className="corporate-panel min-w-0 p-5">
    <FilterBar config={config} region={region} nop={nop} rowGroup={rowGroup} onRegion={onRegion} onNop={onNop} onRowGroup={onRowGroup}/>
    <div className="mt-4 flex flex-wrap items-end gap-3 border-b border-slate-200 pb-4">
      <div><label className="filter-label mb-1 block">DATE FROM</label><input aria-label="Tanggal awal KPI table" type="date" value={rangeStart} onChange={e=>onRangeDate('rangeStart',e.target.value)} className="control h-9 w-[155px] px-3 text-[10px] font-semibold" /></div>
      <div><label className="filter-label mb-1 block">DATE TO</label><input aria-label="Tanggal akhir KPI table" type="date" value={rangeEnd} onChange={e=>onRangeDate('rangeEnd',e.target.value)} className="control h-9 w-[155px] px-3 text-[10px] font-semibold" /></div>
      <button onClick={onClearRange} disabled={!rangeStart&&!rangeEnd} className="btn-secondary h-9 px-3 text-[10px] font-semibold disabled:opacity-40">Reset date</button>
      <p className="pb-2 text-[10px] text-slate-400">{rangeLoading?'Memuat data pada rentang tanggal...':rangeStart&&rangeEnd?'Menampilkan semua upload pada rentang yang dipilih.':'Pilih tanggal awal dan akhir untuk menampilkan beberapa upload.'}</p>
    </div>
    <div className="mt-5"><KpiTable tableRef={tableRef} dashboard={dashboard} region={region} nop={nop} rowGroup={rowGroup}/></div>
  </section>
}

function SummaryCard({ label, value, detail, footer, tone='green', delta }) {
  const palette=tone==='red'?{line:'#E11D48',dot:'#E11D48',value:'#D51B47'}:tone==='navy'?{line:'#111827',dot:'#111827',value:'#173E68'}:{line:'#0A9B67',dot:'#0A9B67',value:'#078558'}
  return <div className="corporate-panel relative min-h-[166px] border-t-[12px] p-4" style={{borderTopColor:palette.line}}>
    <div className="flex items-center gap-2"><span className="h-2 w-2" style={{background:palette.dot}}/><p className="text-[10px] font-semibold tracking-[.05em] text-[#53657A]">{label}</p></div>
    <div className="mt-4 flex items-end gap-2"><p className="text-[24px] font-semibold leading-none" style={{color:palette.value}}>{value}</p>{delta&&<span className={`pb-0.5 text-[10px] font-semibold ${String(delta).startsWith('-')?'text-[#D51B47]':'text-[#078558]'}`}>{delta}</span>}</div>
    <p className="mt-3 text-[9px] leading-4 text-slate-400">{detail}</p>
    {footer&&<p className="absolute bottom-3 left-4 text-[9px] text-slate-400">{footer}</p>}
  </div>
}

function ExportCard({ hasTable, hasReport, reportLoading, tableImageLoading, shareLoading, onDownloadTableImage, onCopyReport, onShareBoth, onSettings }) {
  return <div className="corporate-panel min-h-[160px] p-4">
    <div className="flex items-center justify-between"><p className="text-[10px] font-semibold tracking-[.05em] text-[#53657A]">EXPORT &amp; SHARE</p>{reportLoading&&<RefreshCw size={13} className="animate-spin text-[#173E68]"/>}</div>
    <div className="mt-4 space-y-2">
      <button disabled={!hasTable||tableImageLoading} onClick={onDownloadTableImage} className="btn-secondary flex h-8 w-full items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40">{tableImageLoading?<RefreshCw size={12} className="animate-spin"/>:<Download size={12}/>}<span className="truncate">{tableImageLoading?'Preparing image...':'Download KPI Table Image'}</span></button>
      <div className="grid grid-cols-[1fr_32px] gap-1.5"><button disabled={!hasReport} onClick={onCopyReport} className="btn-secondary flex h-8 items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40"><Clipboard size={12}/><span className="truncate">Copy AI Report</span>{hasReport&&!reportLoading&&<span className="status-ready ml-auto shrink-0">Ready</span>}</button><button onClick={onSettings} className="icon-button flex h-8 items-center justify-center border border-[#CBD5E1] bg-white text-[#52647A]"><Settings2 size={12}/></button></div>
      <button disabled={!hasTable||!hasReport||shareLoading} onClick={onShareBoth} className="btn-primary flex h-8 w-full items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40">{shareLoading?<RefreshCw size={12} className="animate-spin"/>:<Share2 size={12}/>}<span className="truncate">{shareLoading?'Preparing share...':'Share KPI Table + AI Report'}</span></button>
    </div>
  </div>
}

function TopImprovementChart({ items, comparisonAvailable }) {
  const visible=items.slice(0,5)
  const values=visible.map(item=>comparisonAvailable?Math.max(0,Number(item.delta||0)):Math.max(0,Number(item.end||0)))
  const maxValue=Math.max(...values,1)
  return <section className="corporate-panel overflow-hidden p-0">
    <div className="flex h-[58px] items-center gap-3 border-b border-slate-200 bg-[#F7F8FA] px-5">
      <BarChart3 size={15} className="text-[#4F6077]"/>
      <h3 className="text-[12px] font-semibold tracking-[.04em] text-[#40516A]">{comparisonAvailable?'TOP NOP IMPROVEMENT':'TOP NOP PERFORMANCE'}</h3>
    </div>
    <div className="space-y-3.5 p-5">{visible.map((item,index)=>{
      const width=Math.max(2,(values[index]/maxValue)*100)
      return <div key={`${item.nop}-${index}`} className="grid grid-cols-[190px_1fr_90px] items-center gap-4">
        <p className="truncate text-[11px] font-semibold text-[#536177]">{compactNop(item.nop).toUpperCase()}</p>
        <div className="h-[11px] overflow-hidden rounded-sm bg-[#E8EEF6]"><div className="h-full rounded-sm bg-[#5C78AF]" style={{width:`${width}%`}}/></div>
        <span className="text-right text-[11px] font-semibold text-[#4F8667]">{comparisonAvailable?deltaText(item.delta):`${formatNumber(item.end)}%`}</span>
      </div>
    })}</div>
  </section>
}

function NopComparisonPanel({ best, attention, comparisonAvailable }) {
  return <section className="corporate-panel flex h-full flex-col overflow-hidden p-0">
    <div className="grid h-full grid-cols-2 divide-x divide-slate-200">
    <div className="flex min-w-0 flex-col"><div className="flex h-[54px] items-center gap-2 border-b border-emerald-100 px-4 text-[#4F8667]"><TrendingUp size={15}/><h3 className="text-[10px] font-semibold tracking-[.04em]">{comparisonAvailable?'NOP — KENAIKAN TERBAIK':'NOP — KPI TERTINGGI'}</h3></div>
    <div className="flex-1 divide-y divide-slate-200">{best.slice(0,5).map((item,i)=><div key={`${item.nop}-${i}`} className="grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4">
      <span className="text-[11px] font-semibold text-slate-400">{String(i+1).padStart(2,'0')}</span>
      <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#27364B]">{compactNop(item.nop).toUpperCase()}</p><p className="mt-2 text-[10px] text-slate-400">{comparisonAvailable?`${formatNumber(item.start)} → ${formatNumber(item.end)}`:`${formatNumber(item.end)}%`}</p></div>
      <span className="text-[11px] font-semibold text-[#4F8667]">{comparisonAvailable?deltaText(item.delta):`${formatNumber(item.end)}%`}</span>
    </div>)}</div></div><div className="flex min-w-0 flex-col"><div className="flex h-[54px] items-center gap-2 border-b border-red-100 px-4 text-[#C45A68]"><TrendingDown size={15}/><h3 className="text-[10px] font-semibold tracking-[.04em]">NOP — TERENDAH</h3></div><div className="flex-1 divide-y divide-slate-200">{attention.slice(0,5).map((item,i)=><div key={`low-${item.nop}-${i}`} className="grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4"><span className="text-[11px] font-semibold text-slate-400">{String(i+1).padStart(2,'0')}</span><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#27364B]">{compactNop(item.nop).toUpperCase()}</p><p className="mt-2 text-[10px] text-slate-400">{comparisonAvailable?`${formatNumber(item.start)} → ${formatNumber(item.end)}`:`${formatNumber(item.end)}%`}</p></div><span className="text-[11px] font-semibold text-[#C45A68]">{comparisonAvailable?deltaText(item.delta):`${formatNumber(item.end)}%`}</span></div>)}</div></div></div>
  </section>
}

function PointKpiPanel({ best, worst, comparisonAvailable }) {
  return <section className="corporate-panel flex h-full flex-col overflow-hidden p-0">
    <div className="grid h-full grid-cols-2 divide-x divide-slate-200"><div className="flex min-w-0 flex-col"><div className="flex h-[54px] items-center gap-2 border-b border-emerald-100 px-4 text-[#4F8667]"><TrendingUp size={15}/><h3 className="text-[10px] font-semibold tracking-[.04em]">KPI POINT — TERBAIK</h3></div>
    <div className="flex-1 divide-y divide-slate-200">{best.slice(0,5).map((item,i)=><div key={`b-${i}`} className="grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4">
      <span className="text-[11px] font-semibold text-slate-400">{String(i+1).padStart(2,'0')}</span>
      <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#27364B]">{item.component}</p><p className="mt-2 text-[10px] text-slate-400">{item.nop?`NOP ${compactNop(item.nop).toUpperCase()}`:'Rata-rata seluruh NOP'}</p></div>
      <span className="text-[11px] font-semibold text-[#4F8667]">{formatNumber(item.end)}%</span>
    </div>)}</div></div><div className="flex min-w-0 flex-col"><div className="flex h-[54px] items-center gap-2 border-b border-red-100 px-4 text-[#C45A68]"><TrendingDown size={15}/><h3 className="text-[10px] font-semibold tracking-[.04em]">KPI POINT — PERLU PERHATIAN</h3></div><div className="flex-1 divide-y divide-slate-200">{worst.slice(0,5).map((item,i)=><div key={`w-${i}`} className="grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4"><span className="text-[11px] font-semibold text-slate-400">{String(i+1).padStart(2,'0')}</span><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#27364B]">{item.component}</p><p className="mt-2 text-[10px] text-slate-400">{item.nop?`NOP ${compactNop(item.nop).toUpperCase()}`:'Rata-rata seluruh NOP'}</p></div><span className="text-[11px] font-semibold text-[#C45A68]">{formatNumber(item.end)}%</span></div>)}</div></div></div>
  </section>
}

function PromptModal({ draft, setDraft, onClose, onSave }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35"><div className="w-[760px] border border-slate-400 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="section-title">AI REPORT CONFIGURATION</h3><p className="mt-1 text-[10px] text-slate-500">Prompt digunakan untuk report pada filter KPI yang aktif.</p></div><button onClick={onClose} className="icon-button flex h-8 w-8 items-center justify-center border border-slate-300"><X size={14}/></button></div><div className="p-5"><textarea value={draft} onChange={e=>setDraft(e.target.value)} className="control h-[470px] w-full resize-none p-4 text-xs leading-5"/></div><div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3"><button onClick={onClose} className="btn-secondary px-4 py-2 text-[10px] font-semibold">Cancel</button><button onClick={()=>draft.trim()&&onSave(draft.trim())} className="btn-primary px-4 py-2 text-[10px] font-semibold">Save &amp; Regenerate</button></div></div></div>
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words=String(text||'').split(/\s+/).filter(Boolean)
  const lines=[]
  let line=''
  words.forEach(word=>{
    const next=line?`${line} ${word}`:word
    if(line&&context.measureText(next).width>maxWidth){lines.push(line);line=word}
    else line=next
  })
  if(line)lines.push(line)
  const start=y-((lines.length-1)*lineHeight)/2
  lines.forEach((item,index)=>context.fillText(item,x,start+index*lineHeight))
}

async function captureElementToBlob(element) {
  if (!element) throw new Error('Tabel KPI belum tersedia.')
  const table=element.querySelector('table')
  const viewport=element.querySelector('.kpi-scrollbar')
  if(!table||!viewport)throw new Error('Isi tabel KPI belum tersedia.')
  const previousLeft=viewport.scrollLeft,previousTop=viewport.scrollTop
  viewport.scrollLeft=0; viewport.scrollTop=0
  await new Promise(resolve=>requestAnimationFrame(resolve))
  const tableRect=table.getBoundingClientRect()
  const width=Math.ceil(table.scrollWidth)
  const height=Math.ceil(table.scrollHeight)
  // Keep the table's layout size, but draw three times as many pixels so the
  // downloaded PNG stays legible when opened, zoomed, or shared in chat.
  const imageScale=3
  const canvasWidth=width+32,canvasHeight=height+32
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth * imageScale
  canvas.height = canvasHeight * imageScale
  const ctx = canvas.getContext('2d')
  ctx.scale(imageScale,imageScale)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  Array.from(table.querySelectorAll('th,td')).forEach(cell=>{
    const rect=cell.getBoundingClientRect()
    const x=Math.round(rect.left-tableRect.left)+16, y=Math.round(rect.top-tableRect.top)+16
    const w=Math.round(rect.width), h=Math.round(rect.height)
    if(x+w<16||x>canvasWidth-16||y+h<16||y>canvasHeight-16)return
    const style=getComputedStyle(cell)
    ctx.fillStyle=style.backgroundColor&&style.backgroundColor!=='rgba(0, 0, 0, 0)'?style.backgroundColor:'#ffffff'
    ctx.fillRect(x,y,w,h)
    ctx.strokeStyle='#C6D0DC';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1)
    const fontSize=parseFloat(style.fontSize)||10
    const value=cell.innerText.trim()
    const isNumericValue=/^[+-]?(?:\d[\d.,]*|\.\d+)%?$/.test(value)
    const isKpiCategory=cell.classList.contains('kpi-category-cell')
    const emphasizedValue=isNumericValue||isKpiCategory
    const renderFontSize=emphasizedValue?Math.max(fontSize,16):fontSize
    ctx.font=`${emphasizedValue?'700':style.fontWeight} ${renderFontSize}px ${style.fontFamily}`
    ctx.fillStyle=style.color||'#26384F';ctx.textAlign='center';ctx.textBaseline='middle'
    drawWrappedText(ctx,cell.innerText,x+w/2,y+h/2,Math.max(12,w-10),Math.max(11,renderFontSize+4))
  })
  viewport.scrollLeft=previousLeft;viewport.scrollTop=previousTop
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1))
  if(!blob)throw new Error('Gambar KPI Table tidak dapat dibuat.')
  return blob
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea=document.createElement('textarea')
  textarea.value=text
  textarea.style.position='fixed'
  textarea.style.opacity='0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied=document.execCommand('copy')
  textarea.remove()
  if(!copied)throw new Error('Teks tidak dapat disalin oleh browser ini.')
}

class App extends React.Component {
  constructor(props){
    super(props)
    this.state={config:null,run:null,dashboard:null,activePage:'ekpi',preventiveOpen:false,preventiveData:null,preventiveScope:'',preventiveFile:null,preventiveDate:'',preventiveBusy:false,preventiveLoading:false,preventiveFilters:{dateFrom:firstDayOfCurrentMonth(),dateTo:todayIso(),nop:'',siteId:'',search:'',status:'',pic:'',interval:'',typePower:'',scopeItem:'',scheduleState:''},region:'',nop:'',rowGroup:'',historyFilters:{day:'',month:'',year:''},historyItems:[],rangeStart:'',rangeEnd:'',rangeDashboard:null,rangeLoading:false,draftFile:null,draftDate:'',busyUpload:false,pageError:'',prompt:'',promptDraft:'',reportText:'',reportError:'',reportLoading:false,tableImageLoading:false,shareLoading:false,showPrompt:false,notice:''}
    this.requestId=0
    this.preventiveRequestId=0
    this.preventiveSearchTimer=null
    this.tableElement=null
    this.setTableRef=(element)=>{this.tableElement=element}
  }
  componentWillUnmount(){if(this.preventiveSearchTimer)window.clearTimeout(this.preventiveSearchTimer)}
  openPage=async(page)=>{
    const isPreventive=page.startsWith('preventive')
    this.setState({activePage:page,preventiveOpen:isPreventive||this.state.preventiveOpen,pageError:'',notice:''})
    if(page==='preventive-dashboard'||page==='preventive-genset'||page==='preventive-site')await this.refreshPreventive(this.state.preventiveFilters,page==='preventive-genset'?'genset':page==='preventive-site'?'site':'')
  }
  togglePreventive=()=>{
    const open=!this.state.preventiveOpen
    this.setState({preventiveOpen:open})
    if(open&&!this.state.activePage.startsWith('preventive'))this.openPage('preventive-dashboard')
  }
  refreshPreventive=async(filters=this.state.preventiveFilters,scope=this.state.preventiveScope)=>{
    const id=++this.preventiveRequestId
    this.setState({preventiveLoading:true,pageError:''})
    try{
      let activeFilters=filters
      let preventiveData=await getPreventiveDashboard(activeFilters,scope)
      if(!this.state.preventiveData&&preventiveData.plan===0&&preventiveData.latest_upload?.date_start){
        activeFilters={...activeFilters,dateFrom:preventiveData.latest_upload.date_start,dateTo:preventiveData.latest_upload.date_end||preventiveData.latest_upload.date_start}
        preventiveData=await getPreventiveDashboard(activeFilters,scope)
      }
      if(id===this.preventiveRequestId)this.setState({preventiveData,preventiveFilters:activeFilters,preventiveScope:scope})
    }
    catch(e){if(id===this.preventiveRequestId)this.setState({pageError:e.message})}
    finally{if(id===this.preventiveRequestId)this.setState({preventiveLoading:false})}
  }
  handlePreventiveUpload=async()=>{
    const {preventiveFile,preventiveDate,preventiveFilters}=this.state
    if(!preventiveFile||!preventiveDate)return
    this.setState({preventiveBusy:true,pageError:'',notice:''})
    try{
      const result=await uploadPreventive(preventiveFile,preventiveDate)
      const nextFilters={...preventiveFilters,dateFrom:result.date_start||preventiveFilters.dateFrom,dateTo:result.date_end||preventiveFilters.dateTo,nop:'',siteId:'',search:'',status:'',pic:'',interval:'',typePower:'',scopeItem:'',scheduleState:''}
      this.setState({preventiveFilters:nextFilters})
      await this.refreshPreventive(nextFilters,this.state.preventiveScope)
      this.setState({preventiveFile:null,preventiveDate:'',notice:result.replaced_upload_count?'Data preventive pada tanggal upload yang sama berhasil diganti dengan file terbaru.':`${result.row_count} baris preventive berhasil diunggah.`})
    }catch(e){this.setState({pageError:e.message})}
    finally{this.setState({preventiveBusy:false})}
  }
  changePreventiveFilter=(field,value)=>{
    const filters={...this.state.preventiveFilters,[field]:value}
    if(field==='nop')filters.siteId=''
    if(field==='dateFrom'&&value>filters.dateTo)filters.dateTo=value
    if(field==='dateTo'&&value<filters.dateFrom)filters.dateFrom=value
    this.setState({preventiveFilters:filters})
    if(this.preventiveSearchTimer)window.clearTimeout(this.preventiveSearchTimer)
    this.preventiveSearchTimer=window.setTimeout(()=>this.refreshPreventive(filters,this.state.preventiveScope),field==='search'?300:0)
  }
  async componentDidMount(){
    try{
      const config=await getConfig()
      const prompt=localStorage.getItem(PROMPT_KEY)||config.default_prompt
      this.setState({config,prompt,promptDraft:prompt})
      // Riwayat disimpan di database, sedangkan RUN_KEY hanya tersimpan di
      // browser uploader. Ambil riwayat publik agar browser/perangkat baru
      // tetap langsung menampilkan KPI terakhir.
      const historyItems=await this.loadHistory()
      const saved=localStorage.getItem(RUN_KEY)
      if(saved){
        try{
          const run=await getRun(saved)
          this.setState({run})
          if(run.processed){
            const dashboard=await getDashboard(saved,this.state.region,this.state.nop)
            this.setState({dashboard},()=>this.requestReport(run,this.state.region,this.state.nop,prompt))
            return
          }
        }catch(e){localStorage.removeItem(RUN_KEY)}
      }
      const latest=historyItems[0]
      if(latest){
        const run={
          id:latest.run_id,
          upload:latest.history?.upload||{filename:latest.filename||'',date:latest.date_end},
          processed:true,
          report:null,
          prompt:'',
          history:true
        }
        const dashboard=await getDashboard(run.id,this.state.region,this.state.nop)
        localStorage.setItem(RUN_KEY,run.id)
        this.setState({run,dashboard},()=>this.requestReport(run,this.state.region,this.state.nop,prompt))
        return
      }
      const run=await createRun()
      localStorage.setItem(RUN_KEY,run.id)
      this.setState({run})
    }catch(e){this.setState({pageError:e.message})}
  }
  loadHistory=async(filters=this.state.historyFilters)=>{
    try{
      const history=await getHistory(filters)
      const items=history.items||[]
      this.setState({historyItems:items,selectedHistory:[]})
      return items
    }catch(e){
      this.setState({historyItems:[]})
      return []
    }
  }
  requestReport=async(run=this.state.run,region=this.state.region,nop=this.state.nop,prompt=this.state.prompt)=>{
    if(!run||!run.processed||!prompt)return
    const id=++this.requestId
    this.setState({reportLoading:true,reportError:''})
    try{const result=await generateReport(run.id,prompt,region,nop);if(id===this.requestId)this.setState({reportText:result.text})}
    catch(e){if(id===this.requestId)this.setState({reportText:'',reportError:e.message})}
    finally{if(id===this.requestId)this.setState({reportLoading:false})}
  }
  resetRun=async()=>{
    try{const run=await createRun();localStorage.setItem(RUN_KEY,run.id);this.setState({run,dashboard:null,region:'',nop:'',rowGroup:'',reportText:'',reportError:'',draftFile:null,draftDate:'',pageError:'',notice:''})}
    catch(e){this.setState({pageError:e.message})}
  }
  handleUpload=async()=>{
    const {draftFile,draftDate,run,region,nop,prompt}=this.state
    if(!draftFile||!draftDate)return
    this.setState({busyUpload:true,pageError:'',notice:''})
    try{
      const activeRun=run.processed?await createRun():run
      if(run.processed)localStorage.setItem(RUN_KEY,activeRun.id)
      const nextRun=await uploadKpi(activeRun.id,draftFile,draftDate)
      const dashboard=await getDashboard(nextRun.id,region,nop)
      const replacementNotice=nextRun.replaced_upload_count?` File upload sebelumnya pada tanggal yang sama telah digantikan otomatis.`:' Anda dapat upload file Excel lagi dengan tanggal lain.'
      this.setState({run:nextRun,dashboard,rangeDashboard:null,draftFile:null,draftDate:'',notice:`KPI berhasil diproses.${replacementNotice}`},()=>this.requestReport(nextRun,region,nop,prompt))
      await this.loadHistory()
      await this.applyDateRange()
    }catch(e){this.setState({pageError:e.message})}
    finally{this.setState({busyUpload:false})}
  }
  refreshDashboard=async(region=this.state.region,nop=this.state.nop)=>{
    try{const dashboard=await getDashboard(this.state.run.id,region,nop);this.setState({dashboard},()=>this.requestReport(this.state.run,region,nop,this.state.prompt))}
    catch(e){this.setState({pageError:e.message})}
  }
  onRegion=async(value)=>{
    const {config,nop}=this.state
    let nextNop=nop
    const allowed=value?config.regions[value]:Object.values(config.regions).flat()
    if(nextNop&&!allowed.includes(nextNop))nextNop=''
    this.setState({region:value,nop:nextNop})
    if(this.state.run.processed)await this.refreshDashboard(value,nextNop)
  }
  onNop=async(value)=>{this.setState({nop:value});if(this.state.run.processed)await this.refreshDashboard(this.state.region,value)}
  onRowGroup=(value)=>{this.setState({rowGroup:value})}
  onRangeDate=(field,value)=>this.setState({[field]:value},()=>this.applyDateRange())
  clearDateRange=()=>this.setState({rangeStart:'',rangeEnd:'',rangeDashboard:null,pageError:'',notice:'Filter tanggal KPI Table direset.'})
  applyDateRange=async()=>{
    const {rangeStart,rangeEnd,region,nop}=this.state
    if(!rangeStart||!rangeEnd){this.setState({rangeDashboard:null,rangeLoading:false});return}
    if(rangeStart>rangeEnd){this.setState({rangeDashboard:null,pageError:'Tanggal awal tidak boleh lebih besar dari tanggal akhir.'});return}
    this.setState({rangeLoading:true,pageError:''})
    try{
      const history=await getHistory()
      const matches=(history.items||[]).filter(item=>item.date_end>=rangeStart&&item.date_end<=rangeEnd).sort((a,b)=>String(a.date_end).localeCompare(String(b.date_end)))
      if(!matches.length){this.setState({rangeDashboard:null,notice:`Tidak ada data upload antara ${shortDate(rangeStart)} dan ${shortDate(rangeEnd)}.`});return}
      const dashboards=await Promise.all(matches.map(item=>getDashboard(item.run_id,region,nop)))
      this.setState({rangeDashboard:mergeRangeDashboards(dashboards),notice:`KPI Table menampilkan ${matches.length} upload dari ${shortDate(rangeStart)} sampai ${shortDate(rangeEnd)}.`})
    }catch(e){this.setState({rangeDashboard:null,pageError:e.message})}
    finally{this.setState({rangeLoading:false})}
  }
  savePrompt=async(value)=>{localStorage.setItem(PROMPT_KEY,value);this.setState({prompt:value,promptDraft:value,showPrompt:false},()=>this.requestReport(this.state.run,this.state.region,this.state.nop,value))}
  copyReport=async()=>{try{if(this.state.reportText){await copyText(this.state.reportText);this.setState({notice:'AI report berhasil disalin sesuai filter aktif.'})}}catch(e){this.setState({pageError:e.message})}}
  downloadTableImage=async()=>{
    this.setState({tableImageLoading:true,pageError:'',notice:''})
    try{const blob=await captureElementToBlob(this.tableElement);const dateLabel=this.state.rangeEnd||this.state.dashboard?.dataset?.date||todayIso();downloadBlob(blob,`KPI-Table-${dateLabel}.png`);this.setState({notice:'Gambar KPI Table berhasil diunduh sesuai filter aktif.'})}
    catch(e){this.setState({pageError:`Download gambar gagal: ${e.message}`})}
    finally{this.setState({tableImageLoading:false})}
  }
  shareBoth=async()=>{
    this.setState({shareLoading:true,pageError:'',notice:''})
    try{
      const blob=await captureElementToBlob(this.tableElement)
      const file=new File([blob],`KPI-Table-${this.state.rangeEnd||this.state.dashboard?.dataset?.date||todayIso()}.png`,{type:'image/png'})
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({title:'KPI Performance',text:this.state.reportText,files:[file]})
        this.setState({notice:'KPI Table dan AI Report berhasil dibagikan.'})
      }else{
        downloadBlob(blob,file.name)
        await copyText(this.state.reportText)
        this.setState({notice:'Gambar tabel diunduh dan AI Report disalin. Browser ini belum mendukung berbagi file langsung.'})
      }
    }catch(e){if(e.name!=='AbortError')this.setState({pageError:`Share gagal: ${e.message}`})}
    finally{this.setState({shareLoading:false})}
  }
  render(){
    const s=this.state
    if(!s.config||!s.run)return <div className="flex min-h-screen items-center justify-center bg-[#E9EFF5]"><RefreshCw className="animate-spin text-[#173E68]"/></div>
    const ready=s.run.processed&&s.dashboard
    const analysis=ready?s.dashboard.analysis:null
    const best=analysis?.top_nops?.[0]
    const declining=analysis?.attention_nops?.[0]
    const bestNopName=best?compactNop(best.nop):'-'
    const decliningNopName=declining?compactNop(declining.nop):'-'
    const preventivePage=s.activePage.startsWith('preventive')
    const pageTitle=preventivePage?'PREVENTIVE MANAGEMENT':'AUTOMATION MANAGEMENT'
    return <div className="app-shell min-h-screen bg-[#E9EFF5] pl-[250px]">
      <Sidebar activePage={s.activePage} preventiveOpen={s.preventiveOpen} onPage={this.openPage} onTogglePreventive={this.togglePreventive}/>
      <header className="h-[66px] bg-white shadow-[0_1px_0_#D7DFE8]"><div className="flex h-full items-center px-6"><h1 className="text-[20px] font-semibold text-[#29496C]">{pageTitle}</h1></div></header>
      <main className="space-y-4 p-5">
        {s.pageError&&<div className="border border-red-300 bg-red-50 px-4 py-3 text-[10px] text-red-800">{s.pageError}</div>}
        {s.notice&&<div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-medium text-emerald-800">{s.notice}</div>}
        {s.activePage==='ekpi'&&<div>
          <UploadPanel run={s.run} draftFile={s.draftFile} draftDate={s.draftDate} busyUpload={s.busyUpload} setDraftFile={file=>this.setState({draftFile:file})} setDraftDate={value=>this.setState({draftDate:value})} onUpload={this.handleUpload}/>
        </div>}
        {s.activePage==='ekpi'&&ready&&<div className="flex min-w-0 flex-col gap-4">
          <KpiWorkspace config={s.config} dashboard={s.rangeDashboard||s.dashboard} region={s.region} nop={s.nop} rowGroup={s.rowGroup} onRegion={this.onRegion} onNop={this.onNop} onRowGroup={this.onRowGroup} rangeStart={s.rangeStart} rangeEnd={s.rangeEnd} rangeLoading={s.rangeLoading} onRangeDate={this.onRangeDate} onClearRange={this.clearDateRange} tableRef={this.setTableRef}/>
          <div className="grid grid-cols-[1fr_1fr_1fr_1.05fr] gap-4">
            <SummaryCard label={analysis.comparison_available?'NOP IMPROVED':'AVAILABLE NOP'} value={analysis.comparison_available?`${analysis.improved_count} NOPs`:`${analysis.nop_count} NOPs`} detail={analysis.comparison_available?(best?`Peningkatan tertinggi: ${bestNopName} (${deltaText(best.delta)} poin)`:'Belum ada NOP dengan peningkatan'):`Mencakup ${analysis.nop_count} NOP pada filter aktif`} tone="green"/>
            <SummaryCard label={analysis.comparison_available?'NOP DECLINE':'AVERAGE KPI SCORE'} value={analysis.comparison_available?`${analysis.declined_count} NOPs`:`${formatNumber(analysis.current_average)}%`} detail={analysis.comparison_available?(declining?`Penurunan terbesar: ${decliningNopName} (${deltaText(declining.delta)} poin)`:'Tidak ada NOP yang menurun'):`Rata-rata KPI seluruh NOP pada filter`} tone="red"/>
            <SummaryCard label={analysis.comparison_available?'BEST IMPROVEMENT':'BEST KPI SCORE'} value={bestNopName} delta={analysis.comparison_available&&best?`${deltaText(best.delta)}%`:''} detail={best?`${bestNopName} mencatat KPI Score ${formatNumber(best.end)}%`:'Belum ada data KPI'} tone="navy"/>
            <ExportCard hasTable={Boolean(ready)} hasReport={Boolean(s.reportText)} reportLoading={s.reportLoading} tableImageLoading={s.tableImageLoading} shareLoading={s.shareLoading} onDownloadTableImage={this.downloadTableImage} onCopyReport={this.copyReport} onShareBoth={this.shareBoth} onSettings={()=>this.setState({showPrompt:true,promptDraft:s.prompt})}/>
          </div>
          <TopImprovementChart items={analysis.top_nops} comparisonAvailable={analysis.comparison_available}/>
          <div className="grid grid-cols-2 items-stretch gap-4">
            <NopComparisonPanel best={analysis.top_nops} attention={analysis.attention_nops} comparisonAvailable={analysis.comparison_available}/>
            <PointKpiPanel best={analysis.top_components} worst={analysis.worst_components} comparisonAvailable={analysis.comparison_available}/>
          </div>
          {s.reportError&&<div className="border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] text-amber-800">AI Report: {s.reportError}</div>}
        </div>}
        {s.activePage==='preventive-dashboard'&&<PreventiveDashboard data={s.preventiveData} file={s.preventiveFile} date={s.preventiveDate} busy={s.preventiveBusy} loading={s.preventiveLoading} filters={s.preventiveFilters} onFile={file=>this.setState({preventiveFile:file})} onDate={value=>this.setState({preventiveDate:value})} onUpload={this.handlePreventiveUpload} onFilter={this.changePreventiveFilter}/>} 
        {s.activePage==='preventive-genset'&&<PreventiveDashboard data={s.preventiveData} file={s.preventiveFile} date={s.preventiveDate} busy={s.preventiveBusy} loading={s.preventiveLoading} filters={s.preventiveFilters} onFile={file=>this.setState({preventiveFile:file})} onDate={value=>this.setState({preventiveDate:value})} onUpload={this.handlePreventiveUpload} onFilter={this.changePreventiveFilter} maintenanceType="genset"/>} 
        {s.activePage==='preventive-site'&&<PreventiveDashboard data={s.preventiveData} file={s.preventiveFile} date={s.preventiveDate} busy={s.preventiveBusy} loading={s.preventiveLoading} filters={s.preventiveFilters} onFile={file=>this.setState({preventiveFile:file})} onDate={value=>this.setState({preventiveDate:value})} onUpload={this.handlePreventiveUpload} onFilter={this.changePreventiveFilter} maintenanceType="site"/>} 
      </main>
      {s.showPrompt&&<PromptModal draft={s.promptDraft} setDraft={value=>this.setState({promptDraft:value})} onClose={()=>this.setState({showPrompt:false})} onSave={this.savePrompt}/>} 
    </div>
  }
}

ReactDOM.render(<App/>, document.getElementById('root'))
