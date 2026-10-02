var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const React = window.React;
const ReactDOM = window.ReactDOM;
const MissingPmModule = ({ title }) => React.createElement('section',{className:'corporate-panel flex min-h-[360px] items-center justify-center p-8 text-center'},React.createElement('div',null,React.createElement('h2',{className:'section-title'},title),React.createElement('p',{className:'mt-3 text-[11px] text-slate-400'},'Modul halaman belum termuat. Refresh halaman untuk mencoba kembali.')));
const PMSiteModule = window.PMSiteModule || (() => React.createElement(MissingPmModule,{title:'PM SITE BELUM TERSEDIA'}));
const PMGensetWorkspace = window.PMGensetWorkspace || (() => React.createElement(MissingPmModule,{title:'PM GENSET BELUM TERSEDIA'}));
const ICON_PATHS = {
  Activity: ['<path d="M3 12h4l2-7 4 14 2-7h6"/>'],
  BarChart3: ['<path d="M3 3v18h18"/>', '<path d="M7 16v-4M12 16V8M17 16V5"/>'],
  CalendarDays: ['<rect x="3" y="5" width="18" height="16"/>', '<path d="M16 3v4M8 3v4M3 10h18"/>'],
  Check: ['<path d="m5 12 4 4L19 6"/>'],
  ChevronRight: ['<path d="m9 18 6-6-6-6"/>'],
  Clipboard: ['<rect x="8" y="8" width="12" height="12"/>', '<path d="M16 8V4H4v12h4"/>'],
  Download: ['<path d="M12 3v12"/>', '<path d="m7 10 5 5 5-5"/>', '<path d="M5 21h14"/>'],
  FileSpreadsheet: ['<rect x="3" y="3" width="18" height="18"/>', '<path d="M8 3v18M3 9h18M3 15h18"/>'],
  Filter: ['<path d="M4 5h16l-6 7v5l-4 2v-7z"/>'],
  RefreshCw: ['<path d="M20 6v5h-5"/>', '<path d="M4 18v-5h5"/>', '<path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/>'],
  Settings2: ['<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/>', '<circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/>'],
  Share2: ['<circle cx="18" cy="5" r="3"/>', '<circle cx="6" cy="12" r="3"/>', '<circle cx="18" cy="19" r="3"/>', '<path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>'],
  Trash2: ['<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>'],
  TrendingDown: ['<path d="m3 7 6 6 4-4 8 8"/>', '<path d="M15 17h6v-6"/>'],
  TrendingUp: ['<path d="m3 17 6-6 4 4 8-8"/>', '<path d="M15 7h6v6"/>'],
  Upload: ['<path d="M12 16V4"/>', '<path d="m7 9 5-5 5 5"/>', '<path d="M5 20h14"/>'],
  X: ['<path d="M6 6l12 12M18 6 6 18"/>']
};
function SvgIcon({ name, size = 16, className = "" }) {
  return /* @__PURE__ */ React.createElement("svg", { className, width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "square", strokeLinejoin: "miter", "aria-hidden": "true", dangerouslySetInnerHTML: { __html: (ICON_PATHS[name] || []).join("") } });
}
const Activity = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Activity", ...p });
const BarChart3 = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "BarChart3", ...p });
const CalendarDays = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "CalendarDays", ...p });
const Check = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Check", ...p });
const ChevronRight = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "ChevronRight", ...p });
const Clipboard = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Clipboard", ...p });
const Download = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Download", ...p });
const FileSpreadsheet = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "FileSpreadsheet", ...p });
const Filter = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Filter", ...p });
const RefreshCw = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "RefreshCw", ...p });
const Settings2 = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Settings2", ...p });
const Share2 = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Share2", ...p });
const Trash2 = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Trash2", ...p });
const TrendingDown = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "TrendingDown", ...p });
const TrendingUp = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "TrendingUp", ...p });
const Upload = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "Upload", ...p });
const X = (p) => /* @__PURE__ */ React.createElement(SvgIcon, { name: "X", ...p });
const RUN_KEY = "kpi-a1-run-id";
const PROMPT_KEY = "kpi-a1-custom-prompt-single-period";
const CATEGORY_COLORS = { IS: "#92D050", BS: "#00B050", B: "#00B0F0", C: "#FFC000", K: "#C00000" };
const SCALE = { min: [248, 105, 107], mid: [255, 235, 132], max: [99, 190, 123] };
async function api(url, options) {
  const response = await fetch(url, options);
  if (response.ok) { const payload=await response.json(); if(options?.method==='POST'&&(url.endsWith('/upload')||url.includes('/sources/'))){ window.dispatchEvent(new Event('pm-data-uploaded')); try{localStorage.setItem('pm-upload-revision',String(Date.now()));}catch{} } return payload; }
  let message = `Request gagal (${response.status})`;
  try {
    message = (await response.json()).detail || message;
  } catch (e) {
  }
  throw new Error(message);
}
const getConfig = () => api("/api/config");
const createRun = () => api("/api/runs", { method: "POST" });
const getRun = (id) => api(`/api/runs/${id}`);
const getDashboard = (id, region = "", nop = "") => {
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (nop) params.set("nop", nop);
  return api(`/api/runs/${id}/dashboard${params.size ? `?${params}` : ""}`);
};
const getHistory = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.day) params.set("day", filters.day);
  if (filters.month) params.set("month", filters.month);
  if (filters.year) params.set("year", filters.year);
  return api(`/api/history${params.size ? `?${params}` : ""}`);
};
async function getKpiExport(id, region = "", nop = "") {
  var _a;
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (nop) params.set("nop", nop);
  const response = await fetch(`/api/runs/${id}/export.xlsx${params.size ? `?${params}` : ""}`);
  if (!response.ok) {
    let message = `Export gagal (${response.status})`;
    try {
      message = (await response.json()).detail || message;
    } catch (e) {
    }
    throw new Error(message);
  }
  const disposition = response.headers.get("content-disposition") || "";
  const filename = ((_a = disposition.match(/filename="?([^";]+)"?/i)) == null ? void 0 : _a[1]) || `kpi-${id}.xlsx`;
  return { blob: await response.blob(), filename };
}
const generateReport = (id, prompt, region = "", nop = "") => api(`/api/runs/${id}/report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, region: region || null, nop: nop || null })
});
async function uploadKpi(id, file, date) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_date", date);
  return api(`/api/runs/${id}/upload`, { method: "POST", body: form });
}
const getPreventiveDashboard = (filters = {}, maintenanceType = "") => {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);
  if (filters.nop) params.set("nop", filters.nop);
  if (filters.siteId) params.set("site_id", filters.siteId);
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.pic) params.set("pic", filters.pic);
  if (filters.interval) params.set("interval", filters.interval);
  if (filters.typePower) params.set("type_power", filters.typePower);
  if (filters.scopeItem) params.set("scope_item", filters.scopeItem);
  if (filters.scheduleState) params.set("schedule_state", filters.scheduleState);
  if (maintenanceType) params.set("maintenance_type", maintenanceType);
  return api(`/api/preventive/dashboard${params.size ? `?${params}` : ""}`);
};
async function uploadPreventive(file, date, page='dashboard') {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_date", date);
  form.append("upload_page", page);
  return api("/api/preventive/upload", { method: "POST", body: form });
}
function formatNumber(value, digits = 2) {
  if (value === null || value === void 0 || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value));
}
function formatWeight(value) {
  if (value === null || value === void 0) return "";
  return Number.isInteger(Number(value)) ? String(Number(value)) : String(value).replace(".", ",");
}
function shortDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(/* @__PURE__ */ new Date(`${value}T00:00:00`));
}
function shortDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date);
}
function excelDateLabel(value) {
  if (!value) return "-";
  const date = /* @__PURE__ */ new Date(`${value}T00:00:00`);
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${month}-${String(date.getDate()).padStart(2, "0")}`;
}
function compactNop(value) {
  return String(value || "").replace(/^NOP\s+/i, "");
}
function deltaText(value) {
  return `${Number(value) >= 0 ? "+" : ""}${formatNumber(value)}`;
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
function rgb(v) {
  return `rgb(${v[0]},${v[1]},${v[2]})`;
}
function heatColor(value, values) {
  const numeric = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (typeof value !== "number" || !numeric.length) return "#fff";
  const min = Math.min(...numeric), max = Math.max(...numeric), mid = median(numeric);
  if (max === min) return rgb(SCALE.mid);
  if (value <= mid) return rgb(mix(SCALE.min, SCALE.mid, mid === min ? 1 : (value - min) / (mid - min)));
  return rgb(mix(SCALE.mid, SCALE.max, max === mid ? 1 : (value - mid) / (max - mid)));
}
function todayIso() {
  const d = /* @__PURE__ */ new Date();
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function currentMonthIso() {
  return todayIso().slice(0, 7);
}
function firstDayOfCurrentMonth() {
  return `${currentMonthIso()}-01`;
}
function monthLabel(value) {
  if (!value) return "-";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}
function inferDateFromFilename(name) {
  const raw = String(name || "");
  let match = raw.match(/(20\d{2})(0[1-9]|1[0-2])([0-2]\d|3[01])/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = raw.match(/(20\d{2})[-_](0[1-9]|1[0-2])[-_]([0-2]\d|3[01])/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return todayIso();
}
function mergeRangeDashboards(dashboards, dates = []) {
  const latest = dashboards[dashboards.length - 1];
  if (!latest) return null;
  const nops = dashboards.flatMap((dashboard, dashboardIndex) => dashboard.dataset.nops.map((item, itemIndex) => ({
    ...item,
    date: dates[dashboardIndex] || dashboard.dataset.date,
    entryKey: `${dates[dashboardIndex] || dashboard.dataset.date}-${item.name}-${dashboardIndex}-${itemIndex}`
  })));
  return { ...latest, dataset: { ...latest.dataset, nops } };
}
class HoverDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = { position: null };
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
  }
  show(event) {
    const text = this.props.text;
    if (!text) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const boxWidth = Math.min(480, Math.max(280, window.innerWidth - 24));
    const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - boxWidth - 12));
    const showAbove = rect.bottom + 220 > window.innerHeight && rect.top > 220;
    this.setState({ position: showAbove ? { left, bottom: window.innerHeight - rect.top + 8 } : { left, top: rect.bottom + 8 } });
  }
  hide() {
    this.setState({ position: null });
  }
  render() {
    const { text, children, className = "" } = this.props;
    return /* @__PURE__ */ React.createElement("div", { className: `hover-detail-trigger ${className}`, onMouseEnter: this.show, onMouseLeave: this.hide, onFocus: this.show, onBlur: this.hide, tabIndex: text ? 0 : void 0 }, children, this.state.position && ReactDOM.createPortal(/* @__PURE__ */ React.createElement("div", { className: "hover-detail-box", role: "tooltip", style: this.state.position }, text), document.body));
  }
}
function Sidebar({ activePage, preventiveOpen, onPage, onTogglePreventive }) {
  const h=React.createElement;
  const menu=(page,label)=>h('button',{onClick:()=>onPage(page),className:`sidebar-nav-button sidebar-sub-item flex h-[42px] items-center gap-2 text-left text-xs font-semibold ${activePage===page?'is-active':''}`},h(ChevronRight,{size:14,className:`sidebar-arrow ${activePage===page?'is-open':''}`}),h('span',null,label));
  return h('aside',{className:'sidebar-shell fixed left-0 top-0 z-40 h-screen w-[250px] text-white'},
    h('div',{className:'sidebar-brand',role:'banner'},h('img',{src:'/static/logo-triple-e.png',alt:'Triple-E'}),h('div',{className:'sidebar-brand-copy'},h('strong',null,'AREA 1'),h('span',null,'SYSTEM'),h('span',null,'MANAGEMENT'))),
    h('nav',{className:'py-2'},
      h('button',{onClick:()=>onPage('ekpi'),className:`sidebar-nav-button sidebar-main-item flex h-[42px] items-center text-left text-xs font-semibold ${activePage==='ekpi'?'is-active':''}`},h('span',null,'eKPI Automation')),
      h('button',{onClick:()=>onPage('data-upload'),className:`sidebar-nav-button sidebar-main-item flex h-[42px] items-center text-left text-xs font-semibold ${activePage==='data-upload'?'is-active':''}`},h('span',null,'Data Upload')),
      h('button',{onClick:onTogglePreventive,'aria-expanded':preventiveOpen,className:`sidebar-nav-button sidebar-main-item flex h-[42px] items-center gap-2 text-left text-xs font-semibold ${preventiveOpen?'is-active':''}`},h(ChevronRight,{size:15,className:`sidebar-arrow ${preventiveOpen?'is-open':''}`}),h('span',null,'Preventive Management')),
      preventiveOpen&&h('div',{className:'sidebar-subnav py-1'},menu('preventive-dashboard','Dashboard'),menu('preventive-genset','PM Genset'),menu('preventive-site','PM Site'))
    ),
    h('div',{className:'sidebar-links-bottom'},
      h('a',{href:'https://simulatorkpi.3e-sumatera.com/',target:'_blank',rel:'noreferrer',className:'sidebar-nav-button sidebar-main-item sidebar-external flex min-h-[48px] items-center justify-between text-left text-xs font-semibold'},h('span',null,'Simulator Recon KPI'),h('small',null,'HYPERLINK ↗')),
      h('a',{href:'https://cdsticketing.3e-sumatera.com/',target:'_blank',rel:'noreferrer',className:'sidebar-nav-button sidebar-main-item sidebar-external flex min-h-[48px] items-center justify-between text-left text-xs font-semibold'},h('span',null,'CDS Monitoring'),h('small',null,'HYPERLINK ↗'))
    ),
    activePage==='data-upload'&&ReactDOM.createPortal(h('div',{className:'data-upload-page'},h(MasterSiteUploadSection,{revision:window.UploadCenterBridge?.revision,onImported:window.UploadCenterBridge?.onImported,onUploadKpi:window.UploadCenterBridge?.onUploadKpi,onUploadPreventive:window.UploadCenterBridge?.onUploadPreventive})),document.body)
  );
}
async function getImprovementExport(id, region = "", nop = "", dateFrom = "", dateTo = "") {
  const params=new URLSearchParams();if(region)params.set('region',region);if(nop)params.set('nop',nop);if(dateFrom)params.set('date_from',dateFrom);if(dateTo)params.set('date_to',dateTo)
  const response=await fetch(`/api/runs/${id}/mttr-boosting/export.xlsx?${params}`);if(!response.ok){let message=`Export gagal (${response.status})`;try{message=(await response.json()).detail||message}catch{}throw new Error(message)}
  const disposition=response.headers.get('content-disposition')||'',filename=disposition.match(/filename="?([^";]+)"?/i)?.[1]||`Peningkatan-KPI-B-${dateFrom||id}-${dateTo||dateFrom}.xlsx`;return{blob:await response.blob(),filename}
}
async function uploadTicketSummary(id,nop,file){
  const form=new FormData();form.append('file',file);form.append('nop',nop);
  return api(`/api/runs/${id}/ticket-summary`,{method:'POST',body:form});
}
class UploadHistoryButton extends React.Component {
  constructor(props){super(props);this.state={open:false,loading:false,items:[],error:''};}
  close=()=>this.setState({open:false},()=>this.trigger?.focus());
  open=async()=>{
    this.setState({open:true,loading:true,error:''},()=>this.dismiss?.focus());
    try{const result=await api(`/api/uploads?page=${this.props.page}`);this.setState({items:result.items||[]});}
    catch(error){this.setState({error:error.message});}
    finally{this.setState({loading:false});}
  };
  render(){const h=React.createElement,s=this.state,label=this.props.label;
    return h('div',{className:'pm-upload-history'},h('button',{type:'button',className:'pm-upload-history-button','aria-label':`Riwayat upload ${label}`,title:`Riwayat upload ${label}`,onClick:this.open,ref:node=>this.trigger=node},h(CalendarDays,{size:17})),s.open&&h('div',{className:'pm-upload-history-overlay',onClick:event=>{if(event.target===event.currentTarget)this.close();},onKeyDown:event=>{if(event.key==='Escape')this.close();}},h('section',{role:'dialog','aria-modal':true,'aria-label':`Riwayat upload ${label}`,className:'pm-upload-history-dialog'},h('header',null,h('div',null,h('h3',null,`Riwayat upload ${label}`),h('p',null,'File tersimpan pada halaman ini')),h('button',{type:'button','aria-label':'Tutup riwayat upload',onClick:this.close,ref:node=>this.dismiss=node},h(X,{size:18}))),s.loading?h('p',{className:'pm-history-message',role:'status'},'Memuat riwayat…'):s.error?h('p',{className:'pm-history-message',role:'alert'},s.error):s.items.length?h('div',{className:'pm-history-table-scroll'},h('table',null,h('thead',null,h('tr',null,h('th',null,'File upload'),h('th',null,'Upload date'))),h('tbody',null,...s.items.map(item=>h('tr',{key:item.upload_id||item.run_id},h('td',null,item.filename||item.history?.upload?.filename||item.history?.file||'Nama file belum tersedia'),h('td',null,shortDate(item.upload_date||item.history?.upload?.date||item.date_end))))))):h('p',{className:'pm-history-message'},'Belum ada upload tersimpan pada halaman ini.'))));
  }
}
class MasterSiteUploadSection extends React.Component {
  state={kind:'master',drafts:{},busy:false,items:[],loading:true,error:'',message:''};
  componentDidMount(){this.load();window.addEventListener('pm-data-uploaded',this.load);window.addEventListener('storage',this.onStorage);}
  componentWillUnmount(){window.removeEventListener('pm-data-uploaded',this.load);window.removeEventListener('storage',this.onStorage);}
  onStorage=event=>{if(event.key==='pm-upload-revision')this.load();};
  componentDidUpdate(previous){if(previous.revision!==this.props.revision)this.load();}
  load=async()=>{try{const data=await api('/api/data-freshness');this.setState({items:data.items||[],loading:false,error:''});}catch(error){this.setState({error:error.message,loading:false});}};
  setDraft=(change)=>{const kind=this.state.kind;this.setState(current=>({drafts:{...current.drafts,[kind]:{...current.drafts[kind],...change}},error:'',message:''}));};
  upload=async()=>{
    const kind=this.state.kind,draft=this.state.drafts[kind]||{};this.setState({busy:true,error:'',message:''});
    try{
      let result;
      if(kind==='ekpi')result=await this.props.onUploadKpi(draft.file,draft.date);
      else if(['dashboard','genset','site'].includes(kind))result=await this.props.onUploadPreventive(kind,draft.file,draft.date);
      else{const form=new FormData();form.append('file',draft.file);form.append('upload_date',draft.date);result=await api('/api/pm-site/sources/'+kind,{method:'POST',body:form});}
      this.setState(current=>({drafts:{...current.drafts,[kind]:{}},message:(result?.row_count?.toLocaleString('id-ID')||'File')+' berhasil disimpan dan data freshness diperbarui.'}));await this.load();this.props.onImported?.();
    }
    catch(error){this.setState({error:error.message});}finally{this.setState({busy:false});}
  };
  render(){const h=React.createElement,s=this.state,draft=s.drafts[s.kind]||{},types=[['ekpi','eKPI Automation'],['dashboard','PM Punchlist'],['genset','PM Genset'],['site','PM Site'],['master','Master Site'],['ggr','GGR'],['inap','Ticket INAP'],['swfm','Ticket SWFM'],['kpi_b13_r01','KPIData B.1-B.3 R01'],['kpi_b13_r02','KPIData B.1-B.3 R02'],['kpi_b13_r10','KPIData B.1-B.3 R10']],label=types.find(([key])=>key===s.kind)[1],latest=s.items.find(item=>item.key===s.kind)?.latest;
    const formatDate=value=>value&&/^\d{4}-\d{2}-\d{2}/.test(value)?value.slice(8,10)+'/'+value.slice(5,7)+'/'+value.slice(0,4):'-';
    return h('div',{className:'space-y-4'},
      h('section',{className:'corporate-panel data-freshness','aria-label':'Data Freshness'},h('header',null,h('h2',{className:'section-title'},'DATA FRESHNESS'),h('span',null,s.loading?'Memuat…':s.error?'Data belum dapat dibaca':s.items.filter(item=>item.latest).length+' dari '+s.items.length+' data tersedia')),
        h('p',{className:'freshness-note'},'Status diperbarui otomatis setelah upload. KPIData B.1-B.3 disimpan terpisah untuk R01, R02, dan R10 agar setiap regional dapat diperbarui tanpa menghapus regional lain.'),
        h('div',{className:'freshness-grid'},...s.items.map(item=>h('article',{key:item.key,className:'freshness-item'},h('div',{className:'freshness-item-head'},h('strong',null,item.label),h('span',{className:'freshness-status '+(item.needs_upload?'needs-update':item.status==='Tanggal perlu validasi'?'invalid-date':'current')},item.status)),h('p',{className:'freshness-file',title:item.latest?.filename||''},item.latest?.filename||'Belum ada file tersimpan'),h('div',{className:'freshness-item-foot'},h('span',null,'Terakhir: '+formatDate(item.latest?.upload_date)),h('span',null,item.cadence)),h('p',{className:'freshness-renewal '+(item.needs_update?'due':'')},item.renewal_label)))),
        s.error&&h('p',{role:'alert',className:'pm-site-error'},s.error)),
      h('section',{className:'corporate-panel source-upload-section','aria-label':'Upload seluruh data'},h('header',null,h('h2',{className:'section-title'},'UPLOAD SELURUH DATA'),h('p',null,'Pilih jenis data, tanggal, dan file Excel. Semua upload aplikasi dilakukan dari halaman ini.')),
        h('div',{className:'source-tabs upload-center-tabs',role:'tablist','aria-label':'Jenis data upload'},...types.map(([key,name])=>h('button',{key,type:'button',role:'tab','aria-selected':key===s.kind,'aria-controls':'source-upload-panel',id:'source-tab-'+key,disabled:s.busy,onClick:()=>this.setState({kind:key,error:'',message:''})},name))),
        h('div',{id:'source-upload-panel',role:'tabpanel','aria-labelledby':'source-tab-'+s.kind},h('div',{className:'source-current'},h('strong',null,latest?.filename||'Belum ada file '+label+' tersimpan'),h('span',null,'Terakhir upload: '+formatDate(latest?.upload_date))),
          h('div',{className:'source-upload-form'},h('label',{className:'source-file-picker'},h('span',null,'Choose File'),h('span',{title:draft.file?.name||''},draft.file?.name||'Pilih file '+label+' (.xlsx)'),h('input',{key:s.kind+'-'+Boolean(draft.file),type:'file',accept:'.xlsx','aria-label':'File upload '+label,onChange:event=>{const file=event.target.files?.[0]||null;this.setDraft({file,date:file?inferDateFromFilename(file.name):draft.date});}})),h('input',{type:'date',className:'control','aria-label':'Tanggal data upload '+label,value:draft.date||'',disabled:s.busy,onChange:event=>this.setDraft({date:event.target.value})}),h('button',{type:'button',className:'btn-primary',disabled:!draft.file||!draft.date||s.busy,onClick:this.upload},s.busy?'UPLOADING…':'UPLOAD FILE'),h(UploadHistoryButton,{key:s.kind,page:s.kind,label}))),
        s.message&&h('p',{role:'status',className:'source-upload-success'},s.message)),
      this.props.children);
  }
}
function PreventiveUploadPanel({ file, date, busy, latest, onFile, onDate, onUpload, label = "Preventive", historyPage }) {
  return null;
  const display = file ? { filename: file.name, upload_date: date, row_count: null } : latest;
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex h-full min-h-[285px] flex-col p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-h-[72px] items-center border border-[#D8E0EA] bg-[#F7F9FC] px-3" }, /* @__PURE__ */ React.createElement("div", { className: "icon-box mr-3 flex h-10 w-10 items-center justify-center bg-[#087D4B] text-[10px] font-semibold text-white" }, "XLS"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#26384F]" }, (display == null ? void 0 : display.filename) || `Belum ada file ${label} dipilih`), display && /* @__PURE__ */ React.createElement("span", { className: "status-ready" }, "Ready")), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-[10px] text-slate-400" }, display ? `${display.upload_date ? shortDate(display.upload_date) : "Tanggal otomatis"} \xB7 1 file ${label}` : `Pilih satu file ${label} untuk diproses`)), display && /* @__PURE__ */ React.createElement(Check, { size: 16, className: "text-[#0C8A5B]" })), /* @__PURE__ */ React.createElement("label", { className: "mt-3 grid h-[42px] cursor-pointer grid-cols-[92px_1fr] border border-[#D8E0EA] bg-white" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center justify-center border-r border-[#D8E0EA] bg-[#E9EEF4] text-[10px] font-semibold text-[#26384F]" }, "Choose File"), /* @__PURE__ */ React.createElement("span", { className: "flex min-w-0 items-center px-3 text-[10px] text-slate-400" }, /* @__PURE__ */ React.createElement("span", { className: "truncate" }, (file == null ? void 0 : file.name) || `Select ${label} file...`)), /* @__PURE__ */ React.createElement("input", { type: "file", accept: ".xlsx", onChange: (e) => {
    var _a;
    const selected = ((_a = e.target.files) == null ? void 0 : _a[0]) || null;
    onFile(selected);
    if (selected) onDate(inferDateFromFilename(selected.name));
  }, className: "hidden" })), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-right text-[9px] text-slate-400" }, "Format: .xlsx"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 grid grid-cols-[92px_1fr] items-center gap-3" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-semibold tracking-[.04em] text-[#53657A]" }, "UPLOAD DATE"), /* @__PURE__ */ React.createElement("input", { "aria-label": `Tanggal data upload ${label}`, type: "date", value: date || "", onChange: (e) => onDate(e.target.value), className: "control h-[38px] w-full px-3 text-[10px] font-semibold text-[#44556B]" })), /* @__PURE__ */ React.createElement("div", { className: "pm-upload-actions" }, React.createElement("button", { disabled: !file || !date || busy, onClick: onUpload, className: "btn-primary mt-3 flex h-[42px] w-full items-center justify-center gap-2 text-[10px] font-semibold tracking-[.04em] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300" }, busy ? /* @__PURE__ */ React.createElement(RefreshCw, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Upload, { size: 14 }), " ", busy ? "UPLOADING..." : "UPLOAD FILE"), React.createElement(UploadHistoryButton, { page: historyPage || (label === "PM GENSET" ? "genset" : label === "PM SITE" ? "site" : "dashboard"), label: label === "Preventive" ? "Dashboard" : label })), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }));
}
function PreventiveSummaryCard({ label, value, detail, tone }) {
  const colors = { navy: "#173E68", green: "#0B8A5B", orange: "#E27B2B", red: "#D64B55" };
  return /* @__PURE__ */ React.createElement("div", { className: "corporate-panel min-h-[130px] border-t-[7px] p-4", style: { borderTopColor: colors[tone] || colors.navy } }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-semibold tracking-[.05em] text-[#607086]" }, label), /* @__PURE__ */ React.createElement("p", { className: "mt-4 text-[26px] font-semibold leading-none text-[#243A55]" }, value), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-[10px] text-slate-400" }, detail));
}
function masterActiveLabel(value){const text=String(value??'').trim().toLowerCase();return ['true','1','yes','y','ya'].includes(text)?'Ya':['false','0','no','n','tidak'].includes(text)?'Tidak':value;} 
function PreventiveDashboardCards({ data, file, date, busy, loading, filters, onFile, onDate, onUpload, onFilter, onReview, onRefresh }) {
const h = React.createElement;
  const rows = data && data.rows || [];
  const visibleRows = rows.slice(0, 100);
  const details = (row) => [
    ["SCHEDULE DATE", shortDate(row.schedule_date)], ["SUBMITTED DATE", shortDate(row.submitted_date)], ["STATUS", row.status || "-"],
    ["TICKET NO", row.ticket_no || "-"], ["REGIONAL", row.regional || "-"], ["CLUSTER", row.cluster || "-"], ["PIC", row.pic || "-"],
    ["CLASS SITE", row.class_site || "-"], ["TYPE SITE", row.type_site || "-"], ["INTERVAL", row.interval || "-"], ["LAST MAINTENANCE", shortDate(row.last_maintenance)],
    ["DIFF DAYS", row.diff_days || "-"], ["AREA", row.area || "-"], ["CREATED DATE", shortDate(row.created_date)]
  ];
  const summary = h("div", { className: "grid grid-cols-4 gap-4" },
    h(PreventiveSummaryCard, { label: "PLAN SITE", value: data && data.plan != null ? data.plan : 0, detail: `${shortDate(filters.dateFrom)} sampai ${shortDate(filters.dateTo)}`, tone: "navy" }),
    h(PreventiveSummaryCard, { label: "SUBMITTED", value: data && data.submitted != null ? data.submitted : 0, detail: "Site unik dengan Submitted Date terisi", tone: "green" }),
    h(PreventiveSummaryCard, { label: "ACHIEVEMENT", value: `${formatNumber(data && data.achievement != null ? data.achievement : 0)}%`, detail: "Submitted dibanding Plan pada filter aktif", tone: "orange" }),
    h(PreventiveSummaryCard, { label: "BELUM SUBMIT", value: data && data.pending != null ? data.pending : 0, detail: "Site plan yang belum memiliki Submitted Date", tone: "red" })
  );
  const filtersBar = h("div", { className: "preventive-filter-row" },
    h("div", { className: "preventive-filter-search" }, h("label", { className: "filter-label mb-1 block" }, "SEARCH"), h("input", { type: "search", value: filters.search, onChange: (event) => onFilter("search", event.target.value), placeholder: "Cari Site ID, Site Name, NOP, atau Notes", className: "control h-10 w-full px-3 text-[10px]" })),
    h("div", null, h("label", { className: "filter-label mb-1 block" }, "DATE FROM"), h("input", { type: "date", value: filters.dateFrom, onChange: (event) => onFilter("dateFrom", event.target.value), className: "control h-10 w-[155px] px-3 text-[10px] font-semibold" })),
    h("div", null, h("label", { className: "filter-label mb-1 block" }, "DATE TO"), h("input", { type: "date", value: filters.dateTo, onChange: (event) => onFilter("dateTo", event.target.value), className: "control h-10 w-[155px] px-3 text-[10px] font-semibold" })),
    h("div", null, h("label", { className: "filter-label mb-1 block" }, "NOP"), h("select", { value: filters.nop, onChange: (event) => onFilter("nop", event.target.value), className: "control h-10 w-[180px] px-3 text-[10px] font-semibold" }, h("option", { value: "" }, "All NOP"), ...((data && data.nop_options || []).map((item) => h("option", { key: item, value: item }, compactNop(item)))))),
    h("div", null, h("label", { className: "filter-label mb-1 block" }, "SITE ID"), h("select", { value: filters.siteId, onChange: (event) => onFilter("siteId", event.target.value), className: "control h-10 w-[170px] px-3 text-[10px] font-semibold" }, h("option", { value: "" }, "All Site ID"), ...((data && data.site_options || []).map((item) => h("option", { key: item, value: item }, item))))),
    h("div", null, h("label", { className: "filter-label mb-1 block" }, "STATUS PM"), h("select", {value:filters.status||"",onChange:event=>onFilter("status",event.target.value),className:"control h-10 w-[155px] px-3 text-[10px] font-semibold","aria-label":"Status PM Dashboard"},h("option",{value:""},"All Status"),...(data?.status_options||[]).map(status=>h("option",{key:status,value:status},status))))
  );
  const cards = visibleRows.length ? visibleRows.map((row, index) => {
    const key = `${row.site_id}-${row.schedule_date}-${row.ticket_no}-${index}`;
    return h("details", { key, className: "preventive-info-card pm-dashboard-work-card" },
      h("summary", { className: "preventive-card-head" },
        h("div", { className: "preventive-card-section" }, h("p", { className: "preventive-card-label" }, "SITE ID"), h("p", { className: "pm-site-work-value" }, row.site_id)),
        h("div", { className: "preventive-card-section with-divider" }, h("p", { className: "preventive-card-label" }, "SITE NAME"), h("p", { className: "pm-site-work-value" }, row.site_name)),
        h("div", { className: "preventive-card-section with-divider" }, h("p", { className: "preventive-card-label" }, "NOP"), h("p", { className: "pm-site-work-value" }, compactNop(row.nop))),
        h("div", { className: "preventive-card-section with-divider" }, h("p", { className: "preventive-card-label" }, "STATUS PM"), h('div',{className:'pm-card-statuses'},h(window.PMWorkStatus,{status:row.status||'Belum tersedia'}),h(window.PMConditionBadge,{row}))),
        h(ChevronRight, { size: 15, className: "preventive-card-chevron" })
      ),
      h("div", { className: "preventive-card-details" },
        h('div',{className:`pm-dashboard-review ${row.review_reasons?.length?'needs-review':''}`},h('div',null,h('strong',null,row.review_label||'Memerlukan pemeriksaan'),h('p',null,row.review_reasons?.length?row.review_reasons.join(' · '):'Pemeriksaan ringkas jadwal dan Master Site; riwayat gangguan ditinjau pada halaman evaluasi.')),['site','genset'].includes(row.maintenance_kind)&&h('button',{type:'button',onClick:()=>onReview(row)},`Evaluasi ${row.maintenance_kind==='genset'?'PM Genset':'PM Site'} →`)),
        h("div", { className: "preventive-detail-grid" }, ...details(row).map(([label, value]) => h("div", { key: label }, h("p", { className: "preventive-card-label" }, label), label === "STATUS" ? h(window.PMWorkStatus, { status: value }) : h("p", { className: "mt-1 text-[10px] font-medium leading-4 text-[#42536A]" }, value)))),
        h('div',{className:'pm-dashboard-master'},h('h3',null,'MASTER SITE'),row.master?h('div',{className:'preventive-detail-grid'},...[['CLASS / TYPE',[row.master.class_site,row.master.type_site].filter(Boolean).join(' · ')],['REGIONAL / NOP',[row.master.regional,row.master.nop].filter(Boolean).join(' · ')],['CLUSTER',row.master.cluster],['SITE AKTIF',masterActiveLabel(row.master.active)],['GENSET AKTIF',masterActiveLabel(row.master.genset_active)],['OWNER',row.master.owner]].map(([label,value])=>h('div',{key:label},h('p',{className:'preventive-card-label'},label),h('p',{className:'mt-1 text-[10px] text-[#42536A]'},value||'Belum tersedia')))):h('p',null,'Site belum ditemukan pada Master Site. Upload atau periksa data referensi di Dashboard.')),
        h("div", { className: "preventive-notes" }, h("p", { className: "preventive-card-label" }, "NOTES"), h("p", { className: "mt-1 text-[10px] leading-5 text-[#42536A]" }, row.notes || "-"))
      )
    );
  }) : [h("div", { key: "empty", className: "flex h-[180px] items-center justify-center text-[10px] text-slate-400" }, "Belum ada data preventive pada rentang tanggal dan filter ini.")];
  return h("div", { className: "space-y-4" },
    summary,
    h("section", { className: "corporate-panel p-5" }, filtersBar,
      h("div", { className: "mt-4 flex items-center justify-between" }, h("div", null, h("h2", { className: "section-title" }, "GENERAL INFORMATION"), h("p", { className: "mt-1 text-[10px] text-slate-400" }, `Schedule ${data && data.period_start ? shortDate(data.period_start) : "-"} sampai ${data && data.period_end ? shortDate(data.period_end) : "-"} · Menampilkan ${Math.min(rows.length, 100)} dari ${rows.length} site`)), loading && h(RefreshCw, { size: 15, className: "animate-spin text-[#173E68]" })),
      h("div", { className: "kpi-scrollbar preventive-card-list" }, ...cards)
    )
  );
}
function PreventivePlaceholder({ title }) {
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex min-h-[360px] items-center justify-center p-8 text-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "section-title" }, title.toUpperCase()), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-[11px] text-slate-400" }, "Section ini sudah disiapkan pada navigasi dan dapat dilanjutkan setelah desain serta data Excel-nya ditentukan.")));
}
function PreventiveRoutinePage({ data, file, date, busy, loading, filters, onFile, onDate, onUpload, onFilter, kind, onOpenGenset }) {
  if (kind === "site") return React.createElement(PMSiteModule, { filters, pmData: data, upload: onFilter.uploadProps || {}, UploadPanel: ()=>null, SummaryCard: PreventiveSummaryCard });
  const h = React.createElement;
  const upload = onFilter.uploadProps || {};
  const rows = data && data.rows || [];
  const cards = rows.slice(0, 100).map((row, index) => h("button", {
    type: "button", key: `${row.site_id}-${row.schedule_date}-${row.ticket_no}-${index}`,
    className: "preventive-info-card genset-list-card", onClick: () => onOpenGenset && onOpenGenset(row)
  }, h("div", { className: "preventive-card-head" },
    ...[["SITE ID", row.site_id], ["SITE NAME", row.site_name], ["NOP", compactNop(row.nop)], ["PIC", row.pic || "Belum tersedia"], ["STATUS PM", row.status || "Belum tersedia"]].map(([label, value], i) => h("div", { key: label, className: `preventive-card-section ${i ? "with-divider" : ""}` }, h("p", { className: "preventive-card-label" }, label), label === "STATUS PM" ? h('div',{className:'pm-card-statuses'},h(window.PMWorkStatus, { status: value }),h(window.PMConditionBadge,{row})) : h("p", { className: "pm-site-work-value" }, value))),
    h(ChevronRight, { size: 15, className: "preventive-card-chevron" })
  )));
  const routineSelect = (label, field, items, placeholder, width) => h("div", null, h("label", { className: "filter-label mb-1 block" }, label), h("select", { value: filters[field] || "", onChange: (e) => onFilter(field, e.target.value), className: `control h-10 ${width} px-3 text-[10px] font-semibold` }, h("option", { value: "" }, placeholder), ...items.map((item) => h("option", { key: item, value: item }, field === "nop" ? compactNop(item) : ({ overdue: "Terlambat", upcoming: "Belum Jatuh Tempo", submitted: "Submitted" }[item] || item)))));
  const dateRow = h("div", { className: "preventive-filter-row preventive-date-filters" }, h("div", null, h("label", { className: "filter-label mb-1 block" }, "DATE FROM"), h("input", { type: "date", value: filters.dateFrom, onChange: (e) => onFilter("dateFrom", e.target.value), className: "control h-10 w-[155px] px-3 text-[10px] font-semibold" })), h("div", null, h("label", { className: "filter-label mb-1 block" }, "DATE TO"), h("input", { type: "date", value: filters.dateTo, onChange: (e) => onFilter("dateTo", e.target.value), className: "control h-10 w-[155px] px-3 text-[10px] font-semibold" })));
  const operationalFilters = kind === "genset" ? [routineSelect("TYPE POWER", "typePower", data && data.type_power_options || [], "All Type Power", "w-[180px]"), routineSelect("SCOPE ITEM", "scopeItem", data && data.scope_item_options || [], "All Scope Item", "w-[210px]")] : [routineSelect("INTERVAL", "interval", data && data.interval_options || [], "All Interval", "w-[130px]"), routineSelect("KETERLAMBATAN", "scheduleState", ["overdue", "upcoming", "submitted"], "All Schedule", "w-[170px]")];
  const operationalRow = h("div", { className: "preventive-filter-row border-b-0 pb-0" }, routineSelect("NOP", "nop", data && data.nop_options || [], "All NOP", "w-[170px]"), routineSelect("STATUS PM", "status", data && data.status_options || [], "All Status", "w-[150px]"), routineSelect("PIC", "pic", data && data.pic_options || [], "All PIC", "w-[170px]"), ...operationalFilters);
  const filtersBar = h("div", { className: "space-y-3 border-b border-slate-200 pb-4" }, dateRow, operationalRow);
  const title = kind === "genset" ? "PM GENSET" : "PM SITE";
  return h("div", { className: "space-y-4" }, h("div", { className: "grid grid-cols-4 gap-4" }, h(PreventiveSummaryCard, { label: `PLAN ${kind === "genset" ? "GENSET" : "SITE"}`, value: data && data.plan != null ? data.plan : 0, detail: `${shortDate(filters.dateFrom)} sampai ${shortDate(filters.dateTo)}`, tone: "navy" }), h(PreventiveSummaryCard, { label: "SUBMITTED", value: data && data.submitted != null ? data.submitted : 0, detail: "Site unik dengan Submitted Date terisi", tone: "green" }), h(PreventiveSummaryCard, { label: "ACHIEVEMENT", value: `${formatNumber(data && data.achievement != null ? data.achievement : 0)}%`, detail: "Submitted dibanding Plan pada filter aktif", tone: "orange" }), h(PreventiveSummaryCard, { label: "BELUM SUBMIT", value: data && data.pending != null ? data.pending : 0, detail: "Site plan yang belum memiliki Submitted Date", tone: "red" })), h("section", { className: "corporate-panel p-5" }, filtersBar, h("div", { className: "pm-filter-charts" }, h(window.PMAttentionCharts, { rows, kind: "genset", loading })), h("div", { className: "mt-4 flex items-center justify-between" }, h("div", null, h("h2", { className: "section-title" }, `${title} - GENERAL INFORMATION`), h("p", { className: "mt-1 text-[10px] text-slate-400" }, `Schedule ${data && data.period_start ? shortDate(data.period_start) : "-"} sampai ${data && data.period_end ? shortDate(data.period_end) : "-"} · Menampilkan ${Math.min(rows.length, 100)} dari ${rows.length} site`)), loading && h(RefreshCw, { size: 15, className: "animate-spin text-[#173E68]" })), h("div", { className: "kpi-scrollbar preventive-card-list" }, ...(cards.length ? cards : [h("div", { key: "empty", className: "flex h-[180px] items-center justify-center text-[10px] text-slate-400" }, `Belum ada data ${title} pada rentang tanggal dan filter ini.`)]))));
}
function UploadPanel({ run, draftFile, draftDate, busyUpload, setDraftFile, setDraftDate, onUpload }) {
  return null;
  const uploaded = run == null ? void 0 : run.upload;
  const displayFile = draftFile ? { filename: draftFile.name, date: draftDate, valid: false } : uploaded;
  const ready = Boolean(draftFile && draftDate);
  const chooseFile = (selected) => {
    setDraftFile(selected);
    if (selected) setDraftDate(inferDateFromFilename(selected.name));
  };
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex h-full min-h-[285px] flex-col p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-h-[72px] items-center border border-[#D8E0EA] bg-[#F7F9FC] px-3" }, /* @__PURE__ */ React.createElement("div", { className: "icon-box mr-3 flex h-10 w-10 items-center justify-center bg-[#087D4B] text-[10px] font-semibold text-white" }, "XLS"), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#26384F]" }, (displayFile == null ? void 0 : displayFile.filename) || "Belum ada file KPI dipilih"), displayFile && /* @__PURE__ */ React.createElement("span", { className: "status-ready" }, "Ready")), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-[10px] text-slate-400" }, displayFile ? `${displayFile.date ? shortDate(displayFile.date) : "Tanggal otomatis"} \xB7 1 file KPI` : "Pilih satu file raw KPI untuk diproses")), displayFile && /* @__PURE__ */ React.createElement(Check, { size: 16, className: "text-[#0C8A5B]" })), /* @__PURE__ */ React.createElement("label", { className: "mt-3 grid h-[42px] cursor-pointer grid-cols-[92px_1fr] border border-[#D8E0EA] bg-white" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center justify-center border-r border-[#D8E0EA] bg-[#E9EEF4] text-[10px] font-semibold text-[#26384F]" }, "Choose File"), /* @__PURE__ */ React.createElement("span", { className: "flex min-w-0 items-center px-3 text-[10px] text-slate-400" }, /* @__PURE__ */ React.createElement("span", { className: "truncate" }, (draftFile == null ? void 0 : draftFile.name) || "Select RAW eKPI file...")), /* @__PURE__ */ React.createElement("input", { type: "file", accept: ".xlsx", onChange: (e) => {
    var _a;
    return chooseFile(((_a = e.target.files) == null ? void 0 : _a[0]) || null);
  }, className: "hidden" })), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-right text-[9px] text-slate-400" }, "Format: .xlsx"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 grid grid-cols-[92px_1fr] items-center gap-3" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-semibold tracking-[.04em] text-[#53657A]" }, "UPLOAD DATE"), /* @__PURE__ */ React.createElement("input", { "aria-label": "Tanggal data upload", type: "date", value: draftDate || "", onChange: (e) => setDraftDate(e.target.value), className: "control h-[38px] w-full px-3 text-[10px] font-semibold text-[#44556B]" })), /* @__PURE__ */ React.createElement("div", { className: "pm-upload-actions" }, React.createElement("button", { disabled: !ready || busyUpload, onClick: onUpload, className: "btn-primary mt-3 flex h-[42px] w-full items-center justify-center gap-2 text-[10px] font-semibold tracking-[.04em] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300" }, busyUpload ? /* @__PURE__ */ React.createElement(RefreshCw, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Upload, { size: 14 }), " ", busyUpload ? "UPLOADING..." : "UPLOAD FILE"), React.createElement(UploadHistoryButton, { page: "ekpi", label: "eKPI Automation" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }));
}
function HistoryPanel({ items, selectedRunId, selectedHistory, onToggleHistory, onSelectAllHistory, onDeleteHistory, deletingHistory, onSelectHistory, databaseEnabled, scope, onScope, dateValue, onDateFilter, deleteMode, onDeleteMode }) {
  const visibleItems = items.slice(0, 5);
  const allSelected = visibleItems.length > 0 && visibleItems.every((item) => selectedHistory.includes(item.run_id));
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex h-full min-h-[285px] flex-col p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-2 border-b border-slate-200 pb-3" }, /* @__PURE__ */ React.createElement("select", { value: scope, onChange: (e) => onScope(e.target.value), className: "control h-8 min-w-[130px] px-2 text-[10px] font-semibold text-[#44556B]" }, /* @__PURE__ */ React.createElement("option", { value: "recent" }, "All Recent"), /* @__PURE__ */ React.createElement("option", { value: "today" }, "Today"), /* @__PURE__ */ React.createElement("option", { value: "month" }, "This Month"), /* @__PURE__ */ React.createElement("option", { value: "year" }, "This Year")), /* @__PURE__ */ React.createElement("input", { "aria-label": "Filter KPI history berdasarkan tanggal", type: "date", value: dateValue || "", onChange: (e) => onDateFilter(e.target.value), className: "control h-8 w-[150px] px-2 text-[10px] font-semibold text-[#44556B]" }), deleteMode && /* @__PURE__ */ React.createElement("label", { className: "flex h-8 items-center gap-2 border border-[#CBD5E1] bg-white px-2 text-[10px] font-semibold text-[#52647A]" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: allSelected, onChange: (e) => onSelectAllHistory(e.target.checked, visibleItems.map((item) => item.run_id)) }), "All"), /* @__PURE__ */ React.createElement("button", { onClick: deleteMode && selectedHistory.length ? onDeleteHistory : onDeleteMode, className: "icon-button flex h-8 items-center gap-1.5 border border-red-200 bg-white px-2 text-[10px] font-semibold text-red-600" }, /* @__PURE__ */ React.createElement(Trash2, { size: 13 }), deleteMode ? selectedHistory.length ? "Delete" : "Cancel" : "Delete")), !databaseEnabled ? /* @__PURE__ */ React.createElement("div", { className: "mt-4 border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-700" }, "History belum aktif pada konfigurasi saat ini.") : items.length ? /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex-1 space-y-1.5" }, visibleItems.map((item) => {
    var _a, _b, _c, _d;
    const selected = selectedRunId === item.run_id;
    const sites = ((_c = (_b = (_a = item.history) == null ? void 0 : _a.dataset) == null ? void 0 : _b.nops) == null ? void 0 : _c.length) || ((_d = item.history) == null ? void 0 : _d.nop_count) || 0;
    return /* @__PURE__ */ React.createElement("div", { key: item.run_id, className: `grid min-h-[42px] w-full ${deleteMode ? "grid-cols-[24px_1fr_auto]" : "grid-cols-[1fr_auto]"} items-center border px-2.5 text-left ${selected ? "border-[#AFC8E6] bg-[#EFF6FF]" : "border-[#D9E1EB] bg-[#F9FBFD]"}` }, deleteMode && /* @__PURE__ */ React.createElement("input", { "aria-label": `Pilih history ${shortDate(item.date_end)}`, type: "checkbox", checked: selectedHistory.includes(item.run_id), onChange: (e) => onToggleHistory(item.run_id, e.target.checked) }), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `h-2 w-2 shrink-0 rounded-full ${selected ? "bg-[#1B5C9B]" : "bg-[#A6B3C2]"}` }), /* @__PURE__ */ React.createElement("p", { className: "truncate text-[10px] font-semibold text-[#26384F]" }, shortDate(item.date_end)), /* @__PURE__ */ React.createElement("span", { className: "truncate text-[9px] text-slate-400" }, sites ? `${sites} Sites \xB7 ` : "", item.updated_at ? `Today ${shortDateTime(item.updated_at)}` : "Saved KPI")), /* @__PURE__ */ React.createElement("span", { role: "button", tabIndex: "0", onClick: () => onSelectHistory(item.run_id), className: "cursor-pointer px-2 py-1 text-[9px] font-semibold text-[#173E68]" }, "View"));
  })) : /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex flex-1 items-center justify-center border border-dashed border-slate-300 text-[10px] text-slate-400" }, "Belum ada KPI history."));
}
function FilterBar({ config, region, nop, rowGroup, onRegion, onNop, onRowGroup }) {
  const regions = config.regions;
  const options = Object.entries(regions).flatMap(([regional, nops]) => nops.map((nopName) => ({ regional, nop: nopName }))).filter((item) => !region || item.regional === region);
  return /* @__PURE__ */ React.createElement("div", { className: "border-b border-slate-200 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 items-end gap-x-5 gap-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "grid min-w-0 gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "filter-label" }, "REGIONAL"), /* @__PURE__ */ React.createElement("select", { value: region, onChange: (e) => onRegion(e.target.value), className: "control h-9 min-w-0 w-full px-3 text-[10px] font-semibold" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All Regional"), Object.keys(regions).map((r) => /* @__PURE__ */ React.createElement("option", { key: r, value: r }, r)))), /* @__PURE__ */ React.createElement("div", { className: "grid min-w-0 gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "filter-label" }, "NOP"), /* @__PURE__ */ React.createElement("select", { value: nop, onChange: (e) => onNop(e.target.value), className: "control h-9 min-w-0 w-full px-3 text-[10px] font-semibold" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All NOP Cluster"), options.map((item) => /* @__PURE__ */ React.createElement("option", { key: `${item.regional}-${item.nop}`, value: item.nop }, compactNop(item.nop))))), /* @__PURE__ */ React.createElement("div", { className: "grid min-w-0 gap-1" }, /* @__PURE__ */ React.createElement("label", { className: "filter-label" }, "CATEGORY"), /* @__PURE__ */ React.createElement("select", { value: rowGroup, onChange: (e) => onRowGroup(e.target.value), className: "control h-9 min-w-0 w-full px-3 text-[10px] font-semibold" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "All Parameters (A & B)"), /* @__PURE__ */ React.createElement("option", { value: "A" }, "A. Availability Site NE Base Aggregate Cell"), /* @__PURE__ */ React.createElement("option", { value: "B" }, "B. Ticketing Activity & Alarm Handling")))));
}
function KpiTable({ dashboard, region, nop, rowGroup, tableRef }) {
  const dataset = dashboard.dataset;
  const achievementColor = (raw, row) => {
    if (!Number.isFinite(Number(raw))) return null;
    const weight = Number(row.weight);
    const percentage = row.type === "component" && weight > 0 ? Number(raw) / weight * 100 : Number(raw);
    if (percentage > 85) return "#81B982";
    if (percentage >= 80) return "#F6DF88";
    return "#DF706E";
  };
  const displayLabel = value => String(value || '').replace(/\s+per\s+NOP\b/gi, '').replace(/\bNOP\b/gi, '').replace(/\s+/g, ' ').trim();
  const regionOrder = ['R01_Sumbagut','R02_Sumbagsel','R10_Sumbagteng'];
  const nops = dataset.nops.filter((item) => (!region || item.region === region) && (!nop || item.name === nop)).sort((a, b) => {
    const byRegion = regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region);
    const byName = String(a.name).localeCompare(String(b.name));
    return byRegion || byName || String(a.date || dataset.date).localeCompare(String(b.date || dataset.date));
  });
  const nopGroups = nops.reduce((groups, item) => {
    const existing = groups.find((group) => group.name === item.name);
    if (existing) existing.items.push(item);
    else groups.push({ name: item.name, items: [item] });
    return groups;
  }, []);
  const regionGroups = nops.reduce((groups,item) => {
    const name=item.region||'Regional belum tersedia',last=groups[groups.length-1];
    if(last?.name===name)last.count++;else groups.push({name,count:1});
    return groups;
  }, []);
  const rows = dataset.rows.filter((row) => {
    if (!rowGroup) return true;
    if (row.type === "score" || row.type === "category") return true;
    return row.key === rowGroup || row.key.startsWith(`${rowGroup}_`);
  });
  const rowValues = Object.fromEntries(rows.map((row) => [row.key, nops.map((n) => n.values[row.key]).filter((v) => typeof v === "number")]));
  return /* @__PURE__ */ React.createElement("div", { ref: tableRef, className: "kpi-capture min-w-0 max-w-full overflow-hidden bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-scrollbar max-w-full overflow-x-auto border border-[#C9D3DF]" }, /* @__PURE__ */ React.createElement("table", { className: "kpi-table border-collapse text-[10px] text-[#26384F]" }, /* @__PURE__ */ React.createElement("thead", { className: "sticky top-0 z-20" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { rowSpan: 3, className: "sticky left-0 z-40 min-w-[390px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-left font-semibold text-white" }, "Skor KPI"), /* @__PURE__ */ React.createElement("th", { rowSpan: 3, className: "sticky left-[390px] z-40 min-w-[78px] border-b border-r border-[#102C4D] bg-[#1D426E] px-2 py-3 text-center font-semibold text-white" }, "Bobot"), regionGroups.map((group) => React.createElement("th", { key: group.name, colSpan: group.count, scope: "colgroup", className: "border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-center font-semibold text-white" }, group.name))), React.createElement("tr", null, nopGroups.map((group) => /* @__PURE__ */ React.createElement("th", { key: group.name, colSpan: group.items.length, className: "min-w-[110px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-center font-semibold text-white" }, displayLabel(group.name)))), /* @__PURE__ */ React.createElement("tr", null, nops.map((n) => /* @__PURE__ */ React.createElement("th", { key: `${n.entryKey || n.name}-${n.date || dataset.date}`, className: "min-w-[110px] border-b border-r border-[#102C4D] bg-[#1D426E] px-2 py-2 text-center font-semibold text-white" }, excelDateLabel(n.date || dataset.date))))), /* @__PURE__ */ React.createElement("tbody", null, rows.map((row) => {
    const aggregate = row.type === "aggregate", score = row.type === "score", categoryRow = row.type === "category";
    return /* @__PURE__ */ React.createElement("tr", { key: row.key, className: aggregate ? "font-semibold" : "" }, /* @__PURE__ */ React.createElement("td", { className: `sticky left-0 z-10 border-b border-r border-[#C6D0DC] px-3 py-2 text-left ${score || categoryRow ? "bg-[#1D426E] font-semibold text-white" : aggregate ? "bg-[#E8EDF2]" : "bg-white"} ${categoryRow ? "kpi-category-cell" : ""}` }, displayLabel(row.label)), /* @__PURE__ */ React.createElement("td", { className: `${categoryRow ? "kpi-category-cell" : "kpi-numeric-cell"} sticky left-[390px] z-10 border-b border-r border-[#C6D0DC] px-2 py-2 text-center ${score || categoryRow ? "bg-[#1D426E] text-white" : aggregate ? "bg-[#E8EDF2]" : "bg-white"}` }, row.key === "kpi_score" ? "100%" : formatWeight(row.weight)), nops.map((n) => {
      const raw = n.values[row.key];
      let bg = "#fff", color = "#26384F";
      if (categoryRow) {
        bg = CATEGORY_COLORS[String(raw || "")] || "#fff";
        color = "#fff";
      } else if (score) {
        bg = CATEGORY_COLORS[String(n.values.category || "")] || "#fff";
        color = "#fff";
      } else {
        bg = aggregate ? "#E8EDF2" : achievementColor(raw, row) || "#fff";
        color = "#26384F";
      }
      const zeroAsDash = Number(raw) === 0 && (/^A_[1-5]$/.test(row.key) || row.key === "B_2.2");
      if (zeroAsDash) { bg = "#E5E7EB"; color = "#64748B"; }
      return /* @__PURE__ */ React.createElement("td", { key: `${n.entryKey || n.name}-${row.key}`, style: { background: bg, color }, className: `border-b border-r border-[#C6D0DC] px-2 py-2 text-center tabular-nums ${categoryRow ? "kpi-category-cell" : "kpi-numeric-cell"}` }, zeroAsDash ? "-" : categoryRow ? raw || "" : formatNumber(raw));
    }));
  })))));
}
function KpiImprovementPanel({ dashboard, region, nop }) {
  const latest = new Map();
  for (const item of dashboard.dataset.nops) {
    if ((region && item.region !== region) || (nop && item.name !== nop)) continue;
    const previous = latest.get(item.name);
    if (!previous || String(item.date || dashboard.dataset.date) >= String(previous.date || dashboard.dataset.date)) latest.set(item.name, item);
  }
  const regionOrder = ['R01_Sumbagut','R02_Sumbagsel','R10_Sumbagteng'];
  const rows = [...latest.values()].map(item => {
    const score = Number(item.values.kpi_score);
    const tickets = Number.isFinite(score) ? Math.max(0, Math.ceil(85.01 - score)) : null;
    return {...item, score, tickets};
  }).sort((a,b)=>regionOrder.indexOf(a.region)-regionOrder.indexOf(b.region)||String(a.name).localeCompare(String(b.name)));
  const regionGroups=rows.reduce((groups,item)=>{const last=groups[groups.length-1];if(last?.name===item.region)last.count++;else groups.push({name:item.region||'Regional belum tersedia',count:1});return groups;},[]);
  const cell=(item,value,className='',style={})=><td key={`${item.region}-${item.name}-${className}`} style={style} className={`border-b border-r border-[#C6D0DC] px-2 py-3 text-center tabular-nums ${className}`}>{value}</td>;
  const scoreColor=score=>score>85?'#81B982':score>=80?'#F6DF88':'#DF706E';
  return <section className="mt-5" aria-label="Peningkatan KPI">
    <div className="mb-3 border-l-4 border-[#E2A72B] bg-[#FFF9E8] px-4 py-3 text-[10px] leading-5 text-[#5A6472]">Angka menunjukkan estimasi minimum artificial ticket untuk membawa KPI melewati 85%. Nilainya selalu dibulatkan ke atas. Setiap NOP hanya ditampilkan satu kali dengan data tanggal terbaru pada rentang aktif.</div>
    <div className="kpi-capture min-w-0 max-w-full overflow-hidden bg-white">
      <div className="kpi-scrollbar max-w-full overflow-x-auto border border-[#C9D3DF]">
        <table className="kpi-table border-collapse text-[10px] text-[#26384F]">
          <thead><tr><th rowSpan="2" className="min-w-[390px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-left font-semibold text-white">Peningkatan KPI</th><th rowSpan="2" className="min-w-[78px] border-b border-r border-[#102C4D] bg-[#1D426E] px-2 py-3 text-center font-semibold text-white">Target</th>{regionGroups.map(group=><th key={group.name} colSpan={group.count} className="border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-center font-semibold text-white">{group.name}</th>)}</tr><tr>{rows.map(item=><th key={`${item.region}-${item.name}`} className="min-w-[110px] border-b border-r border-[#102C4D] bg-[#1D426E] px-3 py-3 text-center font-semibold text-white">{compactNop(item.name)}</th>)}</tr></thead>
          <tbody>
            <tr><td className="border-b border-r border-[#C6D0DC] bg-white px-3 py-3 text-left font-semibold">KPI Score saat ini</td><td className="border-b border-r border-[#C6D0DC] bg-white px-2 py-3 text-center">&gt; 85%</td>{rows.map(item=>cell(item,Number.isFinite(item.score)?`${formatNumber(item.score)}%`:'-', 'current-score font-semibold',Number.isFinite(item.score)?{background:scoreColor(item.score),color:item.score>=80?'#26384F':'#fff'}:{}))}</tr>
            <tr><td className="border-b border-r border-[#C6D0DC] bg-[#E8EDF2] px-3 py-3 text-left font-semibold">Kategori KPI</td><td className="border-b border-r border-[#C6D0DC] bg-[#81B982] px-2 py-3 text-center font-semibold text-white">BS</td>{rows.map(item=><td key={`${item.name}-category`} style={{background:CATEGORY_COLORS[String(item.values.category||'')]||'#fff',color:'#fff'}} className="border-b border-r border-[#C6D0DC] px-2 py-3 text-center font-semibold">{item.values.category||'-'}</td>)}</tr>
            <tr><td className="border-b border-r border-[#C6D0DC] bg-white px-3 py-3 text-left font-semibold">Tambahan Ticket Dibutuhkan</td><td className="border-b border-r border-[#C6D0DC] bg-white px-2 py-3 text-center"></td>{rows.map(item=>cell(item,item.tickets===null?'-':item.tickets===0?'Tercapai':item.tickets,'ticket-need font-semibold text-[13px]'))}</tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>;
}
class TicketSummaryUpload extends React.Component{
  constructor(props){super(props);this.state={file:null,busy:false,error:''};}
  upload=async()=>{const {file}=this.state;if(!file)return;this.setState({busy:true,error:''});try{await uploadTicketSummary(this.props.runId,this.props.nop,file);this.setState({file:null});await this.props.onUploaded?.();}catch(error){this.setState({error:error.message});}finally{this.setState({busy:false});}}
  render(){const s=this.state;return <div className="kpi-ticket-upload"><p>Tambahkan file Ticket Summary NOP ini untuk menghitung MTTR P90 dari ticket aktual.</p><div><label className="btn-secondary"><input type="file" accept=".xlsx" className="hidden" onChange={event=>this.setState({file:event.target.files?.[0]||null,error:''})}/>{s.file?.name||'Pilih file Ticket Summary'}</label><button type="button" className="btn-primary" disabled={!s.file||s.busy} onClick={this.upload}>{s.busy?'Menyimpan...':'Upload MTTR'}</button></div>{s.error&&<small role="alert">{s.error}</small>}</div>}
}
const B_IMPROVEMENT_LABELS={
  B_1:{label:'Restoration Impact Service Incident Alarm',mttr:true},
  'B_2.1':{label:'Restoration Potential Impact Service Non Incident Alarm Enva',mttr:true},
  'B_2.2':{label:'Restoration Impact Service Non Incident Alarm Controller',mttr:true},
  'B_2.3':{label:'Restoration Impact Service Non Incident Alarm Impact Service Alarm',mttr:true},
  B_3:{label:'Restoration Impact Service Degraded Service (P2 & P3) & Others alarm',mttr:true}
};
function MttrCard({item}){
  const ok=item.achievement<=item.target,gap=item.achievement-item.target,scale=Math.max(item.target,item.achievement);
  return <article className={`kpi-mttr-card ${ok?'is-achieved':'is-review'}`}>
    <header><div><span>MTTR P90</span><h3>{item.severity}</h3></div><span className={`kpi-status-tag ${ok?'is-achieved':'is-review'}`}>{ok?'Target tercapai':'Perlu ditingkatkan'}</span></header>
    <div className="kpi-mttr-values"><div><span>Target SLA</span><strong className="kpi-num">{formatNumber(item.target)} jam</strong></div><div><span>Pencapaian</span><strong className="kpi-num">{formatNumber(item.achievement)} jam</strong></div></div>
    <div className="kpi-mttr-track"><i style={{width:`${Math.min(100,item.target/scale*100)}%`}}></i><em style={{left:`${Math.min(100,item.achievement/scale*100)}%`}}></em></div>
    <p><span className="kpi-num">{item.tickets} ticket</span> dianalisis. {ok?['Lebih cepat ',<span key="g" className="kpi-num">{formatNumber(Math.abs(gap))} jam</span>,' dari target.']:['Perlu turun ',<span key="g" className="kpi-num">{formatNumber(gap)} jam</span>,' lagi untuk mencapai target.']}</p>
  </article>;
}
function TicketNeedGrid({metrics}){
  const opportunities=metrics.filter(item=>Number(item.needed)>0);
  return <div className="kpi-need-block">
    <h3 className="kpi-focus-subtitle">KEBUTUHAN TICKET UNTUK MENCAPAI TARGET MTTR P90</h3>
    {!opportunities.length&&<p className="kpi-boosting-empty">Seluruh severity yang tersedia sudah memenuhi target MTTR P90.</p>}
    <div className="kpi-simulation-grid">{opportunities.map(item=><article key={item.severity} className="is-needed">
        <span>{item.severity}</span>
        <strong className="kpi-num">{item.needed} ticket</strong>
        <small>P90 <span className="kpi-num">{formatNumber(item.achievement)} jam</span> menjadi <span className="kpi-num">{formatNumber(item.simulated)} jam</span></small>
      </article>)}</div>
  </div>;
}
function AchievementCard({label,weight,score}){
  const w=Number(weight)||0,s=Number(score),available=Number.isFinite(s);
  const ok=available&&s>=w-1e-9,gap=available?Math.max(0,w-s):null,scale=Math.max(w,available?s:0)||1;
  return <article className={`kpi-mttr-card ${!available?'is-review':ok?'is-achieved':'is-review'}`}>
    <header><div><span>PENCAPAIAN SKOR</span><h3>{label}</h3></div><span className={`kpi-status-tag ${!available?'is-review':ok?'is-achieved':'is-review'}`}>{!available?'Data belum tersedia':ok?'Target tercapai':'Perlu ditingkatkan'}</span></header>
    <div className="kpi-mttr-values"><div><span>Bobot Maksimal</span><strong className="kpi-num">{formatWeight(w)} poin</strong></div><div><span>Skor Saat Ini</span><strong className="kpi-num">{available?`${formatNumber(s)} poin`:'-'}</strong></div></div>
    <div className="kpi-mttr-track"><i style={{width:`${Math.min(100,w/scale*100)}%`}}></i><em style={{left:`${Math.min(100,(available?s:0)/scale*100)}%`}}></em></div>
    <p>{!available?'Skor komponen ini belum tersedia pada data KPI yang diunggah.':ok?'Skor sudah mencapai bobot maksimal untuk komponen ini.':['Perlu tambahan ',<span key="g" className="kpi-num">{formatNumber(gap)} poin</span>,' lagi untuk mencapai bobot maksimal.']}</p>
    <footer className="kpi-mttr-note">Dihitung dari skor KPI Table (KPIData_SONL1); belum ada rincian ticket per kejadian untuk komponen ini.</footer>
  </article>;
}
function ComponentBBody({code,label,weight,score,mttr,ticketSummary,nop}){
  if(!mttr)return <div className="kpi-nop-focus"><AchievementCard label={label} weight={weight} score={score}/></div>;
  const metrics=(ticketSummary?.components?.[code]||(code==='B_1'?ticketSummary?.metrics||[]:[])).filter(item=>Number(item.tickets)>0);
  if(!metrics.length)return <p className="kpi-b-simple-empty">Data Ticket SWFM untuk {code.replace('_','.')} belum tersedia pada NOP dan periode ini.</p>;
  const potential=Number.isFinite(Number(score))&&Number.isFinite(Number(weight))?Math.max(0,Number(weight)-Number(score)):null;
  return <div className="kpi-nop-focus"><div className="kpi-boosting-summary"><span>MTTR KPI BOOSTING</span><strong>{nop}</strong><p>{potential===null?'Potensi peningkatan skor belum dapat dihitung.':<span>Potensi kenaikan komponen hingga <b className="kpi-num">+{formatNumber(potential)} poin</b> jika seluruh target MTTR tercapai.</span>}</p></div><div className="kpi-mttr-grid">{metrics.map(item=><MttrCard key={item.severity} item={item}/>)}</div><TicketNeedGrid metrics={metrics}/></div>;
}
class NopImprovementCard extends React.Component{
  constructor(props){super(props);this.state={activeCode:'B_1'};}
  render(){const {item,dashboard,rowLookup,ticketSummary}=this.props;const activeCode=this.state.activeCode;const activeMeta=B_IMPROVEMENT_LABELS[activeCode];const activeRow=rowLookup[activeCode]||{};return <details className="preventive-info-card kpi-nop-improve-card">
    <summary className="preventive-card-head kpi-nop-improve-head">
      <div className="preventive-card-section"><p className="preventive-card-label">REGIONAL</p><p className="pm-site-work-value">{item.region}</p></div>
      <div className="preventive-card-section with-divider"><p className="preventive-card-label">NOP</p><p className="pm-site-work-value">{compactNop(item.name)}</p></div>
      <div className="preventive-card-section with-divider"><p className="preventive-card-label">DATA</p><p className="pm-site-work-value">{excelDateLabel(item.date||dashboard.dataset.date)}</p></div>
      <div className="preventive-card-section with-divider"><p className="preventive-card-label">KPI SCORE</p><p className="pm-site-work-value"><span className="kpi-num">{formatNumber(item.values.kpi_score)}%</span> <span className="kpi-category-tag" style={{background:CATEGORY_COLORS[String(item.values.category||'')]||'#64748B'}}>{item.values.category||'-'}</span></p></div>
      <ChevronRight size={15} className="preventive-card-chevron"/>
    </summary>
    <div className="preventive-card-details kpi-nop-improve-details">
      <nav className="kpi-b-tabs" role="tablist" aria-label="Komponen Ticketing Activity & Alarm Handling">{Object.keys(B_IMPROVEMENT_LABELS).map(key=><button key={key} role="tab" aria-selected={activeCode===key} type="button" className={activeCode===key?'is-active':''} onClick={()=>this.setState({activeCode:key})}>{key.replace('_','.')}</button>)}</nav>
      <div className="kpi-b-tab-heading"><span>{activeCode.replace('_','.')}</span><strong>{activeMeta.label}</strong><small>Skor <b className="kpi-num">{formatNumber(item.values?.[activeCode])}</b> dari bobot <b className="kpi-num">{formatWeight(activeRow.weight)}</b></small></div>
      <div className="kpi-b-component-body"><ComponentBBody code={activeCode} label={activeMeta.label} weight={activeRow.weight} score={item.values?.[activeCode]} mttr={activeMeta.mttr} ticketSummary={ticketSummary} nop={item.name}/></div>
    </div>
  </details>;}
}
function NopKpiImprovementView({config,region,nop,dashboard,onRegion,onNop,onBack,dateFrom,dateTo,setDate,boosting,boostingLoading,boostingError,exportLoading,shareLoading,onExport,onShare}){
  const rowLookup=Object.fromEntries(dashboard.dataset.rows.map(row=>[row.key,row]));
  const options=Object.entries(config.regions).flatMap(([regional,nops])=>nops.map(name=>({regional,name}))).filter(item=>!region||item.regional===region);
  const latest=new Map();
  for(const item of dashboard.dataset.nops){
    if((region&&item.region!==region)||(nop&&item.name!==nop))continue;
    const previous=latest.get(item.name);
    if(!previous||String(item.date||dashboard.dataset.date)>=String(previous.date||dashboard.dataset.date))latest.set(item.name,item);
  }
  const activeBoosting=boosting||{ticket_summaries:{}};
  const nops=[...latest.values()].filter(item=>Number(activeBoosting.ticket_summaries?.[item.name]?.source_rows)>0);
  return <section className="corporate-panel kpi-nop-detail">
    <button type="button" className="pm-site-back kpi-improvement-back" onClick={onBack}><span aria-hidden="true">←</span> Kembali ke KPI Table</button>
    <div className="kpi-nop-detail-head"><div><p className="pm-site-eyebrow">PENINGKATAN KPI NOP</p><h2>Evaluasi KPI Ticketing Activity &amp; Alarm Handling B.1 - B.3</h2><p>Setiap card mewakili satu NOP. Buka card, lalu gunakan tab B.1 sampai B.3 untuk melihat MTTR KPI Boosting yang terdeteksi.</p></div><div className="kpi-nop-count"><strong className="kpi-num">{nops.length}</strong><span>NOP ditampilkan</span></div></div>
    <div className="kpi-improvement-filters"><div><label className="filter-label">REGIONAL</label><select value={region} onChange={event=>onRegion(event.target.value)} className="control h-9 min-w-0 w-full px-3 text-[10px] font-semibold"><option value="">All Regional</option>{Object.keys(config.regions).map(name=><option key={name} value={name}>{name}</option>)}</select></div><div><label className="filter-label">NOP</label><select value={nop} onChange={event=>onNop(event.target.value)} className="control h-9 min-w-0 w-full px-3 text-[10px] font-semibold"><option value="">All NOP Cluster</option>{options.map(item=><option key={`${item.regional}-${item.name}`} value={item.name}>{compactNop(item.name)}</option>)}</select></div><div><label className="filter-label">DATE FROM</label><input type="date" value={dateFrom} onChange={event=>setDate('dateFrom',event.target.value)} className="control h-9 min-w-0 w-full px-3 text-[10px] font-semibold"/></div><div><label className="filter-label">DATE TO</label><input type="date" value={dateTo} onChange={event=>setDate('dateTo',event.target.value)} className="control h-9 min-w-0 w-full px-3 text-[10px] font-semibold"/></div><div className="kpi-improvement-export-actions"><label className="filter-label">EXPORT &amp; SHARE</label><div><button type="button" className="btn-secondary" disabled={exportLoading||shareLoading} onClick={onExport}><Download size={12}/>{exportLoading?'Preparing...':'Export Excel'}</button><button type="button" className="btn-primary" disabled={exportLoading||shareLoading} onClick={onShare}><Share2 size={12}/>{shareLoading?'Preparing...':'Share Excel'}</button></div></div></div>
    <p className="mt-2 text-[10px] text-slate-400"><b>Periode Ticket (Date Occurred).</b> Analisis berdasarkan ticket yang terjadi pada rentang tanggal yang dipilih.</p>
    {boostingError&&<p className="pm-site-error" role="alert">{boostingError}</p>}
    {boostingLoading?<div className="kpi-nop-empty"><strong>Memuat data MTTR P90...</strong><p>Menentukan sumber KPIData B.1-B.3 dan fallback Ticket SWFM pada rentang tanggal aktif.</p></div>:[<div key="cards" className="kpi-scrollbar preventive-card-list kpi-nop-improve-list">{nops.map(item=><NopImprovementCard key={item.name} item={item} dashboard={dashboard} rowLookup={rowLookup} ticketSummary={activeBoosting.ticket_summaries?.[item.name]||{}}/>)}</div>,!nops.length&&<div key="empty" className="kpi-nop-empty"><strong>Tidak ada ticket yang terdeteksi</strong><p>Belum ada kombinasi NOP, komponen B, severity, dan rentang tanggal yang sesuai dengan filter aktif.</p></div>]}
  </section>;
}
class NopKpiImprovement extends React.Component{
  constructor(props){super(props);const fallback=String(props.dashboard.dataset.date||'').slice(0,10),dateFrom=props.rangeStart||fallback,dateTo=props.rangeEnd||dateFrom;this.requestRevision=0;this.requestController=null;this.state={dateFrom,dateTo,boosting:null,boostingLoading:true,boostingError:'',exportLoading:false,shareLoading:false};}
  componentDidMount(){this.load();}
  componentDidUpdate(previous){if(previous.runId!==this.props.runId||previous.region!==this.props.region||previous.nop!==this.props.nop)this.load();}
  componentWillUnmount(){this.requestController?.abort();}
  load=async()=>{const {dateFrom,dateTo}=this.state,revision=++this.requestRevision;this.requestController?.abort();const controller=new AbortController();this.requestController=controller;this.setState({boosting:null,boostingLoading:true,boostingError:''});try{const params=new URLSearchParams({date_from:dateFrom,date_to:dateTo,region:this.props.region||'',nop:this.props.nop||''}),boosting=await api(`/api/runs/${this.props.runId}/mttr-boosting?${params}`,{signal:controller.signal});if(revision===this.requestRevision)this.setState({boosting,boostingError:''});}catch(error){if(error.name!=='AbortError'&&revision===this.requestRevision)this.setState({boostingError:error.message});}finally{if(revision===this.requestRevision)this.setState({boostingLoading:false});}};
  setDate=(field,value)=>this.setState(state=>{const next={...state,[field]:value};if(field==='dateFrom'&&value>next.dateTo)next.dateTo=value;if(field==='dateTo'&&value<next.dateFrom)next.dateFrom=value;return next},this.load);
  exportExcel=async()=>{this.setState({exportLoading:true,boostingError:''});try{const file=await getImprovementExport(this.props.runId,this.props.region,this.props.nop,this.state.dateFrom,this.state.dateTo);downloadBlob(file.blob,file.filename)}catch(error){this.setState({boostingError:error.message})}finally{this.setState({exportLoading:false})}};
  shareExcel=async()=>{this.setState({shareLoading:true,boostingError:''});try{const result=await getImprovementExport(this.props.runId,this.props.region,this.props.nop,this.state.dateFrom,this.state.dateTo),file=new File([result.blob],result.filename,{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:'Peningkatan KPI B.1 - B.3',files:[file]});else downloadBlob(result.blob,result.filename)}catch(error){if(error.name!=='AbortError')this.setState({boostingError:error.message})}finally{this.setState({shareLoading:false})}};
  render(){return <NopKpiImprovementView {...this.props} dateFrom={this.state.dateFrom} dateTo={this.state.dateTo} setDate={this.setDate} boosting={this.state.boosting} boostingLoading={this.state.boostingLoading} boostingError={this.state.boostingError} exportLoading={this.state.exportLoading} shareLoading={this.state.shareLoading} onExport={this.exportExcel} onShare={this.shareExcel}/>;}
}
class KpiDetailBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return{error};}
  render(){return this.state.error?<section className="corporate-panel p-5 text-red-700">Detail NOP gagal ditampilkan: {this.state.error.message}</section>:this.props.children;}
}
class KpiWorkspace extends React.Component {
  constructor(props){super(props);this.state={showImprovement:new URLSearchParams(window.location.search).get('view')==='improvement'};}
  componentDidMount(){this.resetFromSidebar=()=>this.setState({showImprovement:false});window.addEventListener('app:navigate',this.resetFromSidebar);}
  componentWillUnmount(){window.removeEventListener('app:navigate',this.resetFromSidebar);}
  render(){
  const { config, dashboard, region, nop, rowGroup, onRegion, onNop, onRowGroup, rangeStart, rangeEnd, rangeLoading, onRangeDate, onClearRange, tableRef, runId, onTicketUploaded }=this.props;
  const {showImprovement}=this.state;
  const hasNop=dashboard.dataset.nops.length>0;
  if(showImprovement)return <KpiDetailBoundary><NopKpiImprovement config={config} region={region} nop={nop} dashboard={dashboard} rangeStart={rangeStart} rangeEnd={rangeEnd} onRegion={onRegion} onNop={onNop} runId={runId} onTicketUploaded={onTicketUploaded} onBack={()=>this.setState({showImprovement:false})}/></KpiDetailBoundary>;
  return <section className="corporate-panel min-w-0 p-5"><FilterBar config={config} region={region} nop={nop} rowGroup={rowGroup} onRegion={onRegion} onNop={onNop} onRowGroup={onRowGroup}/><div className="mt-4 border-b border-slate-200 pb-4"><div className="flex items-end gap-3"><div><label className="filter-label mb-1 block">DATE FROM</label><input aria-label="Tanggal awal KPI table" type="date" value={rangeStart} onChange={e=>onRangeDate("rangeStart",e.target.value)} className="control h-9 w-[135px] px-3 text-[10px] font-semibold"/></div><div><label className="filter-label mb-1 block">DATE TO</label><input aria-label="Tanggal akhir KPI table" type="date" value={rangeEnd} onChange={e=>onRangeDate("rangeEnd",e.target.value)} className="control h-9 w-[135px] px-3 text-[10px] font-semibold"/></div><button onClick={onClearRange} disabled={!rangeStart&&!rangeEnd} className="btn-secondary h-9 whitespace-nowrap px-3 text-[10px] font-semibold disabled:opacity-40">Reset date</button><div><label className="filter-label mb-1 block">ANALISIS</label><button type="button" disabled={!hasNop} onClick={()=>hasNop&&this.setState({showImprovement:true})} className="btn-primary h-9 whitespace-nowrap px-4 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40" title="Buka peningkatan KPI seluruh komponen B">PENINGKATAN KPI</button></div></div><p className="mt-2 text-[10px] text-slate-400">{rangeLoading?"Memuat data pada rentang tanggal...":rangeStart&&rangeEnd?"Menampilkan semua upload pada rentang yang dipilih.":nop?`Analisis card akan dibuka untuk ${compactNop(nop)}.`:"Analisis card akan menampilkan seluruh NOP sesuai filter Regional dan NOP."}</p></div><div className="mt-5"><KpiTable tableRef={tableRef} dashboard={dashboard} region={region} nop={nop} rowGroup={rowGroup}/></div></section>;
  }
}
class KpiCategoryTrend extends React.Component {
  constructor(props){super(props);this.state={items:[],loading:true};}
  componentDidMount(){this.load();}
  componentDidUpdate(previous){if(previous.runId!==this.props.runId)this.load();}
  async load(){
    this.setState({loading:true});
    try{
      const history=await getHistory();
      const latestByMonth=new Map();
      for(const item of (history.items||[]).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))){
        const month=String(item.date_end||'').slice(0,7);
        if(month&&!latestByMonth.has(month))latestByMonth.set(month,item);
      }
      const selected=[...latestByMonth.values()].sort((a,b)=>String(a.date_end).localeCompare(String(b.date_end))).slice(-12);
      const dashboards=await Promise.all(selected.map(item=>getDashboard(item.run_id)));
      this.setState({items:selected.map((item,index)=>({date:item.date_end,dashboard:dashboards[index]})),loading:false});
    }catch(error){this.setState({items:[],loading:false});}
  }
  render(){
    const {region,nop}=this.props, monthName=value=>new Intl.DateTimeFormat('id-ID',{month:'short'}).format(new Date(`${value.slice(0,7)}-01T00:00:00`)).replace('.','');
    const regions=['R01_Sumbagut','R02_Sumbagsel','R10_Sumbagteng'];
    const palette={K:'#C00000',C:'#FFC000',B:'#1683BA',BS:'#13C66B'};
    const labels={K:'Kurang',C:'Cukup',B:'Baik',BS:'Baik Sekali'};
    const groups=regions.filter(name=>!region||region===name).map(name=>({name,bars:this.state.items.map(entry=>{
      const nops=(entry.dashboard?.dataset?.nops||[]).filter(item=>item.region===name&&(!nop||item.name===nop));
      const counts={K:0,C:0,B:0,BS:0};nops.forEach(item=>{const key=String(item.values?.category||'');if(key in counts)counts[key]++;});
      return {date:entry.date,label:monthName(entry.date),counts,total:nops.length};
    }).filter(bar=>bar.total)})).filter(group=>group.bars.length);
    return <section className="corporate-panel p-5" aria-label="Distribusi kategori KPI per regional">
      <div className="mb-5 flex items-center justify-between"><div><h3 className="section-title">DISTRIBUSI KATEGORI KPI</h3><p className="mt-1 text-[10px] text-slate-400">Komposisi NOP per bulan berdasarkan upload terakhir</p></div>{this.state.loading&&<RefreshCw size={15} className="animate-spin text-[#173E68]"/>}</div>
      {groups.length?<div className="grid min-h-[285px] items-end border-b border-l border-[#CBD5E1] px-4 pt-5" style={{gridTemplateColumns:`repeat(${groups.length},minmax(0,1fr))`}}>{groups.map((group,groupIndex)=>{const single=group.bars.length===1,barStyle=single?{display:'flex',flexDirection:'column-reverse',width:'82%',flex:'0 0 82%',height:210}:{display:'flex',flexDirection:'column-reverse',minWidth:24,maxWidth:48,flex:'1 1 0',height:210},labelStyle=single?{width:'82%',flex:'0 0 82%'}:{minWidth:24,maxWidth:48,flex:'1 1 0'};return <div key={group.name} className="flex min-w-0 flex-col px-5" style={groupIndex?{borderLeft:'1px solid #B8C4D2'}:{}}><div className="flex h-[210px] items-end justify-center gap-2">{group.bars.map(bar=><div key={`${group.name}-${bar.date}`} className="flex flex-col-reverse overflow-hidden bg-slate-100" style={barStyle} title={`${group.name} ${bar.label}: ${bar.total} NOP`}>{['K','C','B','BS'].map(key=>bar.counts[key]?<div key={key} className="flex items-center justify-center text-[10px] font-semibold text-white" style={{display:'flex',width:'100%',height:`${bar.counts[key]/bar.total*100}%`,flex:`0 0 ${bar.counts[key]/bar.total*100}%`,background:palette[key]}}>{bar.counts[key]}</div>:null)}</div>)}</div><div className="mt-2 flex justify-center gap-2">{group.bars.map(bar=><span key={bar.date} className="text-center text-[9px] text-slate-500" style={labelStyle}>{bar.label}</span>)}</div><strong className="mt-3 border-t border-[#D7DFE8] py-3 text-center text-[10px] font-medium text-[#5B6472]">{group.name}</strong></div>})}</div>:!this.state.loading&&<p className="border border-dashed border-slate-300 p-8 text-center text-[10px] text-slate-400">Belum ada riwayat KPI untuk grafik distribusi.</p>}
      <div className="mt-4 flex justify-center gap-6">{Object.keys(labels).map(key=><span key={key} className="flex items-center gap-2 text-[10px] text-[#596579]"><i className="h-3 w-3" style={{background:palette[key]}}></i>{labels[key]}</span>)}</div>
    </section>;
  }
}
function SummaryCard({ label, value, detail, footer, tone = "green", delta }) {
  const palette = tone === "red" ? { line: "#E11D48", dot: "#E11D48", value: "#D51B47" } : tone === "navy" ? { line: "#111827", dot: "#111827", value: "#173E68" } : { line: "#0A9B67", dot: "#0A9B67", value: "#078558" };
  return /* @__PURE__ */ React.createElement("div", { className: "corporate-panel relative min-h-[166px] border-t-[12px] p-4", style: { borderTopColor: palette.line } }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-2 w-2", style: { background: palette.dot } }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-semibold tracking-[.05em] text-[#53657A]" }, label)), /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex items-end gap-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-[24px] font-semibold leading-none", style: { color: palette.value } }, value), delta && /* @__PURE__ */ React.createElement("span", { className: `pb-0.5 text-[10px] font-semibold ${String(delta).startsWith("-") ? "text-[#D51B47]" : "text-[#078558]"}` }, delta)), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-[9px] leading-4 text-slate-400" }, detail), footer && /* @__PURE__ */ React.createElement("p", { className: "absolute bottom-3 left-4 text-[9px] text-slate-400" }, footer));
}
function ExportCard({ hasTable, hasReport, reportLoading, tableImageLoading, shareLoading, onDownloadTableImage, onCopyReport, onShareExcel, onSettings }) {
  return /* @__PURE__ */ React.createElement("div", { className: "corporate-panel min-h-[160px] p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-semibold tracking-[.05em] text-[#53657A]" }, "EXPORT & SHARE"), reportLoading && /* @__PURE__ */ React.createElement(RefreshCw, { size: 13, className: "animate-spin text-[#173E68]" })), /* @__PURE__ */ React.createElement("div", { className: "mt-4 space-y-2" }, /* @__PURE__ */ React.createElement("button", { disabled: !hasTable || tableImageLoading, onClick: onDownloadTableImage, className: "btn-secondary flex h-8 w-full items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40" }, tableImageLoading ? /* @__PURE__ */ React.createElement(RefreshCw, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Download, { size: 12 }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, tableImageLoading ? "Preparing image..." : "Download KPI Table Image")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-[1fr_32px] gap-1.5" }, /* @__PURE__ */ React.createElement("button", { disabled: !hasReport, onClick: onCopyReport, className: "btn-secondary flex h-8 items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40" }, /* @__PURE__ */ React.createElement(Clipboard, { size: 12 }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, "Copy AI Report"), hasReport && !reportLoading && /* @__PURE__ */ React.createElement("span", { className: "status-ready ml-auto shrink-0" }, "Ready")), /* @__PURE__ */ React.createElement("button", { onClick: onSettings, className: "icon-button flex h-8 items-center justify-center border border-[#CBD5E1] bg-white text-[#52647A]" }, /* @__PURE__ */ React.createElement(Settings2, { size: 12 }))), /* @__PURE__ */ React.createElement("button", { disabled: !hasTable || shareLoading, onClick: onShareExcel, className: "btn-primary flex h-8 w-full items-center gap-2 px-3 text-[9px] font-semibold disabled:opacity-40" }, shareLoading ? /* @__PURE__ */ React.createElement(RefreshCw, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Share2, { size: 12 }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, shareLoading ? "Preparing Excel..." : "Share Excel File (Filter Aktif)"))));
}
function TopImprovementChart({ items, comparisonAvailable }) {
  const visible = items.slice(0, 5);
  const values = visible.map((item) => comparisonAvailable ? Math.max(0, Number(item.delta || 0)) : Math.max(0, Number(item.end || 0)));
  const maxValue = Math.max(...values, 1);
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel overflow-hidden p-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-[58px] items-center gap-3 border-b border-slate-200 bg-[#F7F8FA] px-5" }, /* @__PURE__ */ React.createElement(BarChart3, { size: 15, className: "text-[#4F6077]" }), /* @__PURE__ */ React.createElement("h3", { className: "text-[12px] font-semibold tracking-[.04em] text-[#40516A]" }, comparisonAvailable ? "TOP NOP IMPROVEMENT" : "TOP NOP PERFORMANCE")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3.5 p-5" }, visible.map((item, index) => {
    const width = Math.max(2, values[index] / maxValue * 100);
    return /* @__PURE__ */ React.createElement("div", { key: `${item.nop}-${index}`, className: "grid grid-cols-[190px_1fr_90px] items-center gap-4" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#536177]" }, compactNop(item.nop).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "h-[11px] overflow-hidden rounded-sm bg-[#E8EEF6]" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-sm bg-[#5C78AF]", style: { width: `${width}%` } })), /* @__PURE__ */ React.createElement("span", { className: "text-right text-[11px] font-semibold text-[#4F8667]" }, comparisonAvailable ? deltaText(item.delta) : `${formatNumber(item.end)}%`));
  })));
}
function NopComparisonPanel({ best, attention, comparisonAvailable }) {
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex h-full flex-col overflow-hidden p-0" }, /* @__PURE__ */ React.createElement("div", { className: "grid h-full grid-cols-2 divide-x divide-slate-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-[54px] items-center gap-2 border-b border-emerald-100 px-4 text-[#4F8667]" }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 15 }), /* @__PURE__ */ React.createElement("h3", { className: "text-[10px] font-semibold tracking-[.04em]" }, comparisonAvailable ? "NOP - KENAIKAN TERBAIK" : "NOP - KPI TERTINGGI")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 divide-y divide-slate-200" }, best.slice(0, 5).map((item, i) => /* @__PURE__ */ React.createElement("div", { key: `${item.nop}-${i}`, className: "grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-400" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#27364B]" }, compactNop(item.nop).toUpperCase()), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-[10px] text-slate-400" }, comparisonAvailable ? `${formatNumber(item.start)} \u2192 ${formatNumber(item.end)}` : `${formatNumber(item.end)}%`)), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-[#4F8667]" }, comparisonAvailable ? deltaText(item.delta) : `${formatNumber(item.end)}%`))))), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-[54px] items-center gap-2 border-b border-red-100 px-4 text-[#C45A68]" }, /* @__PURE__ */ React.createElement(TrendingDown, { size: 15 }), /* @__PURE__ */ React.createElement("h3", { className: "text-[10px] font-semibold tracking-[.04em]" }, "NOP - TERENDAH")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 divide-y divide-slate-200" }, attention.slice(0, 5).map((item, i) => /* @__PURE__ */ React.createElement("div", { key: `low-${item.nop}-${i}`, className: "grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-400" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#27364B]" }, compactNop(item.nop).toUpperCase()), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-[10px] text-slate-400" }, comparisonAvailable ? `${formatNumber(item.start)} \u2192 ${formatNumber(item.end)}` : `${formatNumber(item.end)}%`)), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-[#C45A68]" }, comparisonAvailable ? deltaText(item.delta) : `${formatNumber(item.end)}%`)))))));
}
function PointKpiPanel({ best, worst, comparisonAvailable }) {
  return /* @__PURE__ */ React.createElement("section", { className: "corporate-panel flex h-full flex-col overflow-hidden p-0" }, /* @__PURE__ */ React.createElement("div", { className: "grid h-full grid-cols-2 divide-x divide-slate-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-[54px] items-center gap-2 border-b border-emerald-100 px-4 text-[#4F8667]" }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 15 }), /* @__PURE__ */ React.createElement("h3", { className: "text-[10px] font-semibold tracking-[.04em]" }, "KPI POINT - TERBAIK")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 divide-y divide-slate-200" }, best.slice(0, 5).map((item, i) => /* @__PURE__ */ React.createElement("div", { key: `b-${i}`, className: "grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-400" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement(HoverDetail, { text: item.component }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#27364B]" }, item.component)), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-[10px] text-slate-400" }, "Achievement score")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-[#4F8667]" }, formatNumber(item.end), "%"))))), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-[54px] items-center gap-2 border-b border-red-100 px-4 text-[#C45A68]" }, /* @__PURE__ */ React.createElement(TrendingDown, { size: 15 }), /* @__PURE__ */ React.createElement("h3", { className: "text-[10px] font-semibold tracking-[.04em]" }, "KPI POINT - PERLU PERHATIAN")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 divide-y divide-slate-200" }, worst.slice(0, 5).map((item, i) => /* @__PURE__ */ React.createElement("div", { key: `w-${i}`, className: "grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-400" }, String(i + 1).padStart(2, "0")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement(HoverDetail, { text: item.component }, /* @__PURE__ */ React.createElement("p", { className: "truncate text-[11px] font-semibold text-[#27364B]" }, item.component)), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-[10px] text-slate-400" }, "Achievement score")), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-[#C45A68]" }, formatNumber(item.end), "%")))))));
}
function PointKpiPanel({ best, worst }) {
  const h = React.createElement;
  const renderRows = (items, tone) => items.slice(0, 5).map((item, index) => h("div", { key: `${tone}-${item.nop || "all"}-${item.key || item.component}-${index}`, className: "grid min-h-[76px] grid-cols-[28px_1fr_auto] items-start gap-2 px-4 py-4" }, h("span", { className: "text-[11px] font-semibold text-slate-400" }, String(index + 1).padStart(2, "0")), h("div", { className: "min-w-0" }, h(HoverDetail, { text: item.component }, h("p", { className: "truncate text-[11px] font-semibold text-[#27364B]" }, item.component)), h("p", { className: "mt-2 text-[10px] text-slate-400" }, item.nop ? `NOP ${compactNop(item.nop).toUpperCase()}` : "Rata-rata seluruh NOP")), h("span", { className: `text-[11px] font-semibold ${tone === "best" ? "text-[#4F8667]" : "text-[#C45A68]"}` }, formatNumber(item.end), "%")));
  const column = (title, icon, tone, items) => h("div", { className: "flex min-w-0 flex-col" }, h("div", { className: `flex h-[54px] items-center gap-2 border-b px-4 ${tone === "best" ? "border-emerald-100 text-[#4F8667]" : "border-red-100 text-[#C45A68]"}` }, h(icon, { size: 15 }), h("h3", { className: "text-[10px] font-semibold tracking-[.04em]" }, title)), h("div", { className: "flex-1 divide-y divide-slate-200" }, ...renderRows(items, tone)));
  return h("section", { className: "corporate-panel flex h-full flex-col overflow-hidden p-0" }, h("div", { className: "grid h-full grid-cols-2 divide-x divide-slate-200" }, column("KPI POINT - TERBAIK", TrendingUp, "best", best), column("KPI POINT - PERLU PERHATIAN", TrendingDown, "worst", worst)));
}
function PromptModal({ draft, defaultPrompt, setDraft, onClose, onSave }) {
  const basePrompt=defaultPrompt||window.__defaultReportPrompt||draft;
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35" }, /* @__PURE__ */ React.createElement("div", { className: "w-[760px] border border-slate-400 bg-white" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-slate-200 px-5 py-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "section-title" }, "CUSTOM REPORT WHATSAPP"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-[10px] text-slate-500" }, "Ubah instruksi dan format report. Prompt custom disimpan pada browser ini.")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "icon-button flex h-8 w-8 items-center justify-center border border-slate-300" }, /* @__PURE__ */ React.createElement(X, { size: 14 }))), /* @__PURE__ */ React.createElement("div", { className: "p-5" }, /* @__PURE__ */ React.createElement("textarea", { value: draft, onChange: (e) => setDraft(e.target.value), className: "control h-[470px] w-full resize-none p-4 text-xs leading-5" })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-2 border-t border-slate-200 px-5 py-3" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setDraft(basePrompt), className: "btn-secondary mr-auto px-4 py-2 text-[10px] font-semibold" }, "Gunakan Prompt Bawaan"), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "btn-secondary px-4 py-2 text-[10px] font-semibold" }, "Batal"), /* @__PURE__ */ React.createElement("button", { onClick: () => draft.trim() && onSave(draft.trim()), className: "btn-primary px-4 py-2 text-[10px] font-semibold" }, "Simpan & Buat Ulang"))));
}
function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  const start = y - (lines.length - 1) * lineHeight / 2;
  lines.forEach((item, index) => context.fillText(item, x, start + index * lineHeight));
}
async function captureElementToBlob(element) {
  if (!element) throw new Error("Tabel KPI belum tersedia.");
  const table = element.querySelector("table");
  const viewport = element.querySelector(".kpi-scrollbar");
  if (!table || !viewport) throw new Error("Isi tabel KPI belum tersedia.");
  const previousLeft = viewport.scrollLeft, previousTop = viewport.scrollTop;
  viewport.scrollLeft = 0;
  viewport.scrollTop = 0;
  table.classList.add("is-capturing");
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const tableRect = table.getBoundingClientRect();
  const width = Math.ceil(table.scrollWidth);
  const height = Math.ceil(table.scrollHeight);
  const imageScale = 3;
  const canvasWidth = width + 32, canvasHeight = height + 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth * imageScale;
  canvas.height = canvasHeight * imageScale;
  const ctx = canvas.getContext("2d");
  ctx.scale(imageScale, imageScale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  Array.from(table.querySelectorAll("th,td")).forEach((cell) => {
    const rect = cell.getBoundingClientRect();
    const x = Math.round(rect.left - tableRect.left) + 16, y = Math.round(rect.top - tableRect.top) + 16;
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (x + w < 16 || x > canvasWidth - 16 || y + h < 16 || y > canvasHeight - 16) return;
    const style = getComputedStyle(cell);
    ctx.fillStyle = style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" ? style.backgroundColor : "#ffffff";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#C6D0DC";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const fontSize = parseFloat(style.fontSize) || 10;
    const value = cell.innerText.trim();
    const isNumericValue = /^[+-]?(?:\d[\d.,]*|\.\d+)%?$/.test(value);
    const isKpiCategory = cell.classList.contains("kpi-category-cell");
    const emphasizedValue = isNumericValue || isKpiCategory;
    const renderFontSize = emphasizedValue ? Math.max(fontSize, 16) : fontSize;
    ctx.font = `${emphasizedValue ? "700" : style.fontWeight} ${renderFontSize}px ${style.fontFamily}`;
    ctx.fillStyle = style.color || "#26384F";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawWrappedText(ctx, cell.innerText, x + w / 2, y + h / 2, Math.max(12, w - 10), Math.max(11, renderFontSize + 4));
  });
  viewport.scrollLeft = previousLeft;
  viewport.scrollTop = previousTop;
  table.classList.remove("is-capturing");
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) throw new Error("Gambar KPI Table tidak dapat dibuat.");
  return blob;
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
async function copyText(text) {
  var _a;
  if ((_a = navigator.clipboard) == null ? void 0 : _a.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Teks tidak dapat disalin oleh browser ini.");
}
class App extends React.Component {
  constructor(props) {
    super(props);
    __publicField(this, "openPage", async (page, preserveFilters = false) => {
      const isPreventive = page.startsWith("preventive");
      window.history.replaceState({},'',page==='data-upload'?`${window.location.pathname}?page=data-upload`:window.location.pathname);
      window.dispatchEvent(new Event('app:navigate'));
      clearTimeout(this.preventiveSearchTimer);
      const filters = preserveFilters ? this.state.preventiveFilters : { dateFrom: firstDayOfCurrentMonth(), dateTo: todayIso(), nop: "", siteId: "", search: "", status: "", pic: "", interval: "", typePower: "", scopeItem: "", scheduleState: "" };
      this.setState({ preventiveFilters:filters, navigationRevision:(this.state.navigationRevision||0)+1, activePage: page, preventiveOpen: isPreventive || this.state.preventiveOpen, preventiveFile:null, preventiveDate:'', preventiveData:isPreventive?null:this.state.preventiveData, pageError: "", notice: "" });
      if (page === "preventive-dashboard" || page === "preventive-genset" || page === "preventive-site") await this.refreshPreventive(filters, page === "preventive-genset" ? "genset" : page === "preventive-site" ? "site" : "");
    });
    __publicField(this, "togglePreventive", () => {
      const open = !this.state.preventiveOpen;
      this.setState({ preventiveOpen: open });
    });
    __publicField(this, "refreshPreventive", async (filters = this.state.preventiveFilters, scope = this.state.preventiveScope) => {
      var _a;
      const id = ++this.preventiveRequestId;
      this.setState({ preventiveLoading: true, pageError: "" });
      try {
        let activeFilters = filters;
        let preventiveData = await getPreventiveDashboard(activeFilters, scope);
        if ((!this.state.preventiveData || this.state.preventiveScope !== scope) && preventiveData.plan === 0 && ((_a = preventiveData.latest_upload) == null ? void 0 : _a.date_start)) {
          activeFilters = { ...activeFilters, dateFrom: preventiveData.latest_upload.date_start, dateTo: preventiveData.latest_upload.date_end || preventiveData.latest_upload.date_start };
          preventiveData = await getPreventiveDashboard(activeFilters, scope);
        }
        if (id === this.preventiveRequestId) this.setState({ preventiveData, preventiveFilters: activeFilters, preventiveScope: scope });
      } catch (e) {
        if (id === this.preventiveRequestId) this.setState({ pageError: e.message });
      } finally {
        if (id === this.preventiveRequestId) this.setState({ preventiveLoading: false });
      }
    });
    __publicField(this, "handlePreventiveUpload", async () => {
      const { preventiveFile, preventiveDate, preventiveFilters } = this.state;
      if (!preventiveFile || !preventiveDate) return;
      this.setState({ preventiveBusy: true, pageError: "", notice: "" });
      try {
        const result = await uploadPreventive(preventiveFile, preventiveDate, this.state.activePage==='preventive-genset'?'genset':this.state.activePage==='preventive-site'?'site':'dashboard');
        const nextFilters = { ...preventiveFilters, dateFrom: result.date_start || preventiveFilters.dateFrom, dateTo: result.date_end || preventiveFilters.dateTo, nop: "", siteId: "", search: "", status: "", pic: "", interval: "", typePower: "", scopeItem: "", scheduleState: "" };
        this.setState({ preventiveFilters: nextFilters });
        await this.refreshPreventive(nextFilters, this.state.preventiveScope);
        this.setState({ preventiveFile: null, preventiveDate: "", notice: result.replaced_upload_count ? "Data preventive pada tanggal upload yang sama berhasil diganti dengan file terbaru." : `${result.row_count} baris preventive berhasil diunggah.` });
      } catch (e) {
        this.setState({ pageError: e.message });
      } finally {
        this.setState({ preventiveBusy: false });
      }
    });
    __publicField(this, "changePreventiveFilter", (field, value) => {
      const filters = { ...this.state.preventiveFilters, [field]: value };
      if (field === "nop") filters.siteId = "";
      if (field === "dateFrom" && value > filters.dateTo) filters.dateTo = value;
      if (field === "dateTo" && value < filters.dateFrom) filters.dateFrom = value;
      this.setState({ preventiveFilters: filters });
      if (this.preventiveSearchTimer) window.clearTimeout(this.preventiveSearchTimer);
      this.preventiveSearchTimer = window.setTimeout(() => this.refreshPreventive(filters, this.state.preventiveScope), field === "search" ? 300 : 0);
    });
    __publicField(this, "loadHistory", async (filters = this.state.historyFilters) => {
      try {
        const history = await getHistory(filters);
        const items = history.items || [];
        this.setState({ historyItems: items, selectedHistory: [] });
        return items;
      } catch (e) {
        this.setState({ historyItems: [] });
        return [];
      }
    });
    __publicField(this, "requestReport", async (run = this.state.run, region = this.state.region, nop = this.state.nop, prompt = this.state.prompt) => {
      if (!run || !run.processed || !prompt) return;
      const id = ++this.requestId;
      this.setState({ reportLoading: true, reportError: "" });
      try {
        const result = await generateReport(run.id, prompt, region, nop);
        if (id === this.requestId) this.setState({ reportText: result.text });
      } catch (e) {
        if (id === this.requestId) this.setState({ reportText: "", reportError: e.message });
      } finally {
        if (id === this.requestId) this.setState({ reportLoading: false });
      }
    });
    __publicField(this, "resetRun", async () => {
      try {
        const run = await createRun();
        localStorage.setItem(RUN_KEY, run.id);
        this.setState({ run, dashboard: null, region: "", nop: "", rowGroup: "", reportText: "", reportError: "", draftFile: null, draftDate: "", pageError: "", notice: "" });
      } catch (e) {
        this.setState({ pageError: e.message });
      }
    });
    __publicField(this, "handleUpload", async () => {
      const { draftFile, draftDate, run, region, nop, prompt } = this.state;
      if (!draftFile || !draftDate) return;
      this.setState({ busyUpload: true, pageError: "", notice: "" });
      try {
        const activeRun = run.processed ? await createRun() : run;
        if (run.processed) localStorage.setItem(RUN_KEY, activeRun.id);
        const nextRun = await uploadKpi(activeRun.id, draftFile, draftDate);
        const dashboard = await getDashboard(nextRun.id, region, nop);
        const replacementNotice = nextRun.replaced_upload_count ? ` File upload sebelumnya pada tanggal yang sama telah digantikan otomatis.` : " Anda dapat upload file Excel lagi dengan tanggal lain.";
        this.setState({ run: nextRun, dashboard, rangeDashboard: null, draftFile: null, draftDate: "", notice: `KPI berhasil diproses.${replacementNotice}` }, () => this.requestReport(nextRun, region, nop, prompt));
        await this.loadHistory();
        await this.applyDateRange();
      } catch (e) {
        this.setState({ pageError: e.message });
      } finally {
        this.setState({ busyUpload: false });
      }
    });
    __publicField(this, "handleCentralKpiUpload", async (file,date) => {
      const {run,region,nop,prompt}=this.state;
      const activeRun=run.processed?await createRun():run;
      if(run.processed)localStorage.setItem(RUN_KEY,activeRun.id);
      const nextRun=await uploadKpi(activeRun.id,file,date),dashboard=await getDashboard(nextRun.id,region,nop);
      this.setState({run:nextRun,dashboard,rangeDashboard:null,notice:'eKPI berhasil diproses dari Data Upload.'},()=>this.requestReport(nextRun,region,nop,prompt));
      await this.loadHistory();
      return {row_count:nextRun.upload?.nop_count||dashboard.dataset?.nops?.length||0};
    });
    __publicField(this, "handleCentralPreventiveUpload", async (kind,file,date) => {
      const result=await uploadPreventive(file,date,kind);
      this.setState({notice:`${result.row_count} baris ${kind==='dashboard'?'PM Punchlist':kind==='genset'?'PM Genset':'PM Site'} berhasil diunggah.`});
      return result;
    });
    __publicField(this, "refreshDashboard", async (region = this.state.region, nop = this.state.nop) => {
      try {
        const dashboard = await getDashboard(this.state.run.id, region, nop);
        this.setState({ dashboard }, () => this.requestReport(this.state.run, region, nop, this.state.prompt));
      } catch (e) {
        this.setState({ pageError: e.message });
      }
    });
    __publicField(this, "onRegion", async (value) => {
      const { config, nop } = this.state;
      let nextNop = nop;
      const allowed = value ? config.regions[value] : Object.values(config.regions).flat();
      if (nextNop && !allowed.includes(nextNop)) nextNop = "";
      this.setState({ region: value, nop: nextNop });
      if (this.state.run.processed) await this.refreshDashboard(value, nextNop);
    });
    __publicField(this, "onNop", async (value) => {
      this.setState({ nop: value });
      if (this.state.run.processed) await this.refreshDashboard(this.state.region, value);
    });
    __publicField(this, "onRowGroup", (value) => {
      this.setState({ rowGroup: value });
    });
    __publicField(this, "onRangeDate", (field, value) => this.setState({ [field]: value }, () => this.applyDateRange()));
    __publicField(this, "clearDateRange", () => this.setState({ rangeStart: "", rangeEnd: "", rangeDashboard: null, pageError: "", notice: "Filter tanggal KPI Table direset." }));
    __publicField(this, "applyDateRange", async () => {
      const { rangeStart, rangeEnd, region, nop } = this.state;
      if (!rangeStart || !rangeEnd) {
        this.setState({ rangeDashboard: null, rangeLoading: false });
        return;
      }
      if (rangeStart > rangeEnd) {
        this.setState({ rangeDashboard: null, pageError: "Tanggal awal tidak boleh lebih besar dari tanggal akhir." });
        return;
      }
      this.setState({ rangeLoading: true, pageError: "" });
      try {
        const history = await getHistory();
        const matches = (history.items || []).filter((item) => item.date_end >= rangeStart && item.date_end <= rangeEnd).sort((a, b) => String(a.date_end).localeCompare(String(b.date_end)));
        if (!matches.length) {
          this.setState({ rangeDashboard: null, notice: `Tidak ada data upload antara ${shortDate(rangeStart)} dan ${shortDate(rangeEnd)}.` });
          return;
        }
        const dashboards = await Promise.all(matches.map((item) => getDashboard(item.run_id, region, nop)));
        this.setState({ rangeDashboard: mergeRangeDashboards(dashboards, matches.map(item => item.date_end)), notice: `KPI Table menampilkan ${matches.length} upload dari ${shortDate(rangeStart)} sampai ${shortDate(rangeEnd)}.` });
      } catch (e) {
        this.setState({ rangeDashboard: null, pageError: e.message });
      } finally {
        this.setState({ rangeLoading: false });
      }
    });
    __publicField(this, "savePrompt", async (value) => {
      localStorage.setItem(PROMPT_KEY, value);
      this.setState({ prompt: value, promptDraft: value, showPrompt: false }, () => this.requestReport(this.state.run, this.state.region, this.state.nop, value));
    });
    __publicField(this, "copyReport", async () => {
      try {
        if (this.state.reportText) {
          await copyText(this.state.reportText);
          this.setState({ notice: "AI report berhasil disalin sesuai filter aktif." });
        }
      } catch (e) {
        this.setState({ pageError: e.message });
      }
    });
    __publicField(this, "downloadTableImage", async () => {
      var _a, _b;
      this.setState({ tableImageLoading: true, pageError: "", notice: "" });
      try {
        const blob = await captureElementToBlob(this.tableElement);
        const dateLabel = this.state.rangeEnd || ((_b = (_a = this.state.dashboard) == null ? void 0 : _a.dataset) == null ? void 0 : _b.date) || todayIso();
        downloadBlob(blob, `KPI-Table-${dateLabel}.png`);
        this.setState({ notice: "Gambar KPI Table berhasil diunduh sesuai filter aktif." });
      } catch (e) {
        this.setState({ pageError: `Download gambar gagal: ${e.message}` });
      } finally {
        this.setState({ tableImageLoading: false });
      }
    });
    __publicField(this, "shareExcel", async () => {
      var _a, _b, _c;
      this.setState({ shareLoading: true, pageError: "", notice: "" });
      try {
        const exported=await getKpiExport(this.state.run.id,this.state.region,this.state.nop),blob=exported.blob;
        const file = new File([blob], exported.filename, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        if (navigator.share && ((_c = navigator.canShare) == null ? void 0 : _c.call(navigator, { files: [file] }))) {
          await navigator.share({ title: "KPI Performance", files: [file] });
          this.setState({ notice: "File Excel KPI sesuai filter aktif berhasil dibagikan." });
        } else {
          downloadBlob(blob, file.name);
          this.setState({ notice: "File Excel KPI sesuai filter aktif diunduh karena browser belum mendukung berbagi file langsung." });
        }
      } catch (e) {
        if (e.name !== "AbortError") this.setState({ pageError: `Share gagal: ${e.message}` });
      } finally {
        this.setState({ shareLoading: false });
      }
    });
    this.state = { config: null, run: null, dashboard: null, activePage: new URLSearchParams(window.location.search).get('page')==='data-upload'?"data-upload":"ekpi", preventiveOpen: false, preventiveData: null, preventiveScope: "", preventiveFile: null, preventiveDate: "", preventiveBusy: false, preventiveLoading: false, preventiveFilters: { dateFrom: firstDayOfCurrentMonth(), dateTo: todayIso(), nop: "", siteId: "", search: "", status: "", pic: "", interval: "", typePower: "", scopeItem: "", scheduleState: "" }, region: "", nop: "", rowGroup: "", historyFilters: { day: "", month: "", year: "" }, historyItems: [], rangeStart: "", rangeEnd: "", rangeDashboard: null, rangeLoading: false, draftFile: null, draftDate: "", busyUpload: false, pageError: "", prompt: "", promptDraft: "", reportText: "", reportError: "", reportLoading: false, tableImageLoading: false, shareLoading: false, showPrompt: false, notice: "" };
    this.requestId = 0;
    this.preventiveRequestId = 0;
    this.preventiveSearchTimer = null;
    this.tableElement = null;
    this.setTableRef = (element) => {
      this.tableElement = element;
    };
  }
  componentWillUnmount() {
    if (this.preventiveSearchTimer) window.clearTimeout(this.preventiveSearchTimer);
  }
  async componentDidMount() {
    try {
      const config = await getConfig();
      window.__defaultReportPrompt=config.default_prompt;
      const prompt = localStorage.getItem(PROMPT_KEY) || config.default_prompt;
      this.setState({ config, prompt, promptDraft: prompt });
      const historyItems = (await this.loadHistory()).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
      const saved = localStorage.getItem(RUN_KEY);
      if (saved && (!historyItems.length || saved===historyItems[0].run_id)) {
        try {
          const run2 = await getRun(saved);
          this.setState({ run: run2 });
          if (run2.processed) {
            const dashboard = await getDashboard(saved, this.state.region, this.state.nop);
            this.setState({ dashboard }, () => this.requestReport(run2, this.state.region, this.state.nop, prompt));
            return;
          }
        } catch (e) {
          localStorage.removeItem(RUN_KEY);
        }
      }
      const latest = historyItems[0];
      if (latest) {
        const run2 = {
          id: latest.run_id,
          upload: (latest.history == null ? void 0 : latest.history.upload) || { filename: latest.filename || "", date: latest.date_end },
          processed: true,
          report: null,
          prompt: "",
          history: true
        };
        const dashboard = await getDashboard(run2.id, this.state.region, this.state.nop);
        localStorage.setItem(RUN_KEY, run2.id);
        this.setState({ run: run2, dashboard }, () => this.requestReport(run2, this.state.region, this.state.nop, prompt));
        return;
      }
      const run = await createRun();
      localStorage.setItem(RUN_KEY, run.id);
      this.setState({ run });
    } catch (e) {
      this.setState({ pageError: e.message });
    }
  }
  render() {
    var _a, _b;
    const s = this.state;
    this.changePreventiveFilter.uploadProps = { file: s.preventiveFile, date: s.preventiveDate, busy: s.preventiveBusy, onFile: (file) => this.setState({ preventiveFile: file }), onDate: (value) => this.setState({ preventiveDate: value }), onUpload: this.handlePreventiveUpload };
    if (!s.config || !s.run) return /* @__PURE__ */ React.createElement("div", { className: "flex min-h-screen items-center justify-center bg-[#E9EFF5]" }, /* @__PURE__ */ React.createElement(RefreshCw, { className: "animate-spin text-[#173E68]" }));
    const ready = s.run.processed && s.dashboard;
    const analysis = ready ? s.dashboard.analysis : null;
    const best = (_a = analysis == null ? void 0 : analysis.top_nops) == null ? void 0 : _a[0];
    const declining = (_b = analysis == null ? void 0 : analysis.attention_nops) == null ? void 0 : _b[0];
    const bestNopName = best ? compactNop(best.nop) : "-";
    const decliningNopName = declining ? compactNop(declining.nop) : "-";
    const preventivePage = s.activePage.startsWith("preventive");
    const pageTitle = s.activePage==='data-upload' ? "DATA UPLOAD" : preventivePage ? "PREVENTIVE MANAGEMENT" : "AUTOMATION MANAGEMENT";
    const refreshTicketSummary=async()=>{const dashboard=await getDashboard(s.run.id,s.region,s.nop);this.setState({dashboard,rangeDashboard:null,notice:'Ticket Summary MTTR tersimpan untuk NOP ini.'});};
    window.UploadCenterBridge={revision:s.run?.id,onImported:()=>this.refreshDashboard(),onUploadKpi:this.handleCentralKpiUpload,onUploadPreventive:this.handleCentralPreventiveUpload};
    return /* @__PURE__ */ React.createElement("div", { className: "app-shell min-h-screen bg-[#E9EFF5] pl-[250px]" }, /* @__PURE__ */ React.createElement(Sidebar, { activePage: s.activePage, preventiveOpen: s.preventiveOpen, onPage: this.openPage, onTogglePreventive: this.togglePreventive }), /* @__PURE__ */ React.createElement("header", { className: "h-[66px] bg-white shadow-[0_1px_0_#D7DFE8]" }, /* @__PURE__ */ React.createElement("div", { className: "flex h-full items-center px-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-[20px] font-semibold text-[#29496C]" }, pageTitle))), /* @__PURE__ */ React.createElement("main", { className: "space-y-4 p-5" }, s.pageError && /* @__PURE__ */ React.createElement("div", { className: "border border-red-300 bg-red-50 px-4 py-3 text-[10px] text-red-800" }, s.pageError), s.notice && /* @__PURE__ */ React.createElement("div", { className: "border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-medium text-emerald-800" }, s.notice), s.activePage === "ekpi" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(UploadPanel, { run: s.run, draftFile: s.draftFile, draftDate: s.draftDate, busyUpload: s.busyUpload, setDraftFile: (file) => this.setState({ draftFile: file }), setDraftDate: (value) => this.setState({ draftDate: value }), onUpload: this.handleUpload })), s.activePage === "ekpi" && ready && /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col gap-4" }, /* @__PURE__ */ React.createElement(KpiWorkspace, { config: s.config, dashboard: s.rangeDashboard || s.dashboard, region: s.region, nop: s.nop, rowGroup: s.rowGroup, onRegion: this.onRegion, onNop: this.onNop, onRowGroup: this.onRowGroup, rangeStart: s.rangeStart, rangeEnd: s.rangeEnd, rangeLoading: s.rangeLoading, onRangeDate: this.onRangeDate, onClearRange: this.clearDateRange, tableRef: this.setTableRef, runId:s.run.id, onTicketUploaded:refreshTicketSummary }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-[1fr_1fr_1fr_1.05fr] gap-4" }, /* @__PURE__ */ React.createElement(SummaryCard, { label: analysis.comparison_available ? "NOP IMPROVED" : "AVAILABLE NOP", value: analysis.comparison_available ? `${analysis.improved_count} NOPs` : `${analysis.nop_count} NOPs`, detail: analysis.comparison_available ? best ? `Peningkatan tertinggi: ${bestNopName} (${deltaText(best.delta)} poin)` : "Belum ada NOP dengan peningkatan" : `Mencakup ${analysis.nop_count} NOP pada filter aktif`, tone: "green" }), /* @__PURE__ */ React.createElement(SummaryCard, { label: analysis.comparison_available ? "NOP DECLINE" : "AVERAGE KPI SCORE", value: analysis.comparison_available ? `${analysis.declined_count} NOPs` : `${formatNumber(analysis.current_average)}%`, detail: analysis.comparison_available ? declining ? `Penurunan terbesar: ${decliningNopName} (${deltaText(declining.delta)} poin)` : "Tidak ada NOP yang menurun" : `Rata-rata KPI seluruh NOP pada filter`, tone: "red" }), /* @__PURE__ */ React.createElement(SummaryCard, { label: analysis.comparison_available ? "BEST IMPROVEMENT" : "BEST KPI SCORE", value: bestNopName, delta: analysis.comparison_available && best ? `${deltaText(best.delta)}%` : "", detail: best ? `${bestNopName} mencatat KPI Score ${formatNumber(best.end)}%` : "Belum ada data KPI", tone: "navy" }), /* @__PURE__ */ React.createElement(ExportCard, { hasTable: Boolean(ready), hasReport: Boolean(s.reportText), reportLoading: s.reportLoading, tableImageLoading: s.tableImageLoading, shareLoading: s.shareLoading, onDownloadTableImage: this.downloadTableImage, onCopyReport: this.copyReport, onShareExcel: this.shareExcel, onSettings: () => this.setState({ showPrompt: true, promptDraft: s.prompt }) })), /* @__PURE__ */ React.createElement(KpiCategoryTrend, { runId: s.run.id, region: s.region, nop: s.nop }), /* @__PURE__ */ React.createElement(TopImprovementChart, { items: analysis.top_nops, comparisonAvailable: analysis.comparison_available }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 items-stretch gap-4" }, /* @__PURE__ */ React.createElement(NopComparisonPanel, { best: analysis.top_nops, attention: analysis.attention_nops, comparisonAvailable: analysis.comparison_available }), /* @__PURE__ */ React.createElement(PointKpiPanel, { best: analysis.top_components, worst: analysis.worst_components, comparisonAvailable: analysis.comparison_available })), s.reportError && /* @__PURE__ */ React.createElement("div", { className: "border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] text-amber-800" }, "AI Report: ", s.reportError)), s.activePage === "preventive-dashboard" && /* @__PURE__ */ React.createElement(PreventiveDashboardCards, { data: s.preventiveData, file: s.preventiveFile, date: s.preventiveDate, busy: s.preventiveBusy, loading: s.preventiveLoading, filters: s.preventiveFilters, onFile: (file) => this.setState({ preventiveFile: file }), onDate: (value) => this.setState({ preventiveDate: value }), onUpload: this.handlePreventiveUpload, onFilter: this.changePreventiveFilter, onRefresh: () => this.refreshPreventive(), onReview: (row) => { const page=row.maintenance_kind === "genset" ? "preventive-genset" : "preventive-site"; this.setState({preventiveFilters:{...this.state.preventiveFilters,siteId:row.site_id,search:"",nop:""}},()=>this.openPage(page,true)); } }), s.activePage === "preventive-genset" && /* @__PURE__ */ React.createElement(PMGensetWorkspace, { key:s.navigationRevision, RoutinePage: PreventiveRoutinePage, SummaryCard: PreventiveSummaryCard, data: s.preventiveData, loading: s.preventiveLoading, filters: s.preventiveFilters, onFilter: this.changePreventiveFilter, kind: "genset" }), s.activePage === "preventive-site" && /* @__PURE__ */ React.createElement(PreventiveRoutinePage, { key:s.navigationRevision, data: s.preventiveData, loading: s.preventiveLoading, filters: s.preventiveFilters, onFilter: this.changePreventiveFilter, kind: "site" })), s.showPrompt && /* @__PURE__ */ React.createElement(PromptModal, { draft: s.promptDraft, setDraft: (value) => this.setState({ promptDraft: value }), onClose: () => this.setState({ showPrompt: false }), onSave: this.savePrompt }));
  }
}
ReactDOM.render(/* @__PURE__ */ React.createElement(App, null), document.getElementById("root"));
