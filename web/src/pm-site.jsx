(function () {
  const R = window.React;
  window.PMAttentionCharts = window.PMAttentionCharts || (() => null);
  const statuses = ['Belum ditinjau', 'Perlu konfirmasi NOP', 'Sedang ditindaklanjuti', 'Menunggu verifikasi', 'Selesai'];
  const emptyEvaluation = { evaluation_status: 'Belum ditinjau', priority: 'Rendah', evaluator_pic: '', target_date: '', conclusion: '', follow_up_action: '', verification_note: '' };
  const display = value => value === null || value === undefined || value === '' ? 'Belum tersedia' : String(value);
  const date = value => value ? value.replace('T', ' ') : 'Belum tersedia';
  const shortDate = value => value ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value.slice(0, 10) + 'T00:00:00Z')) : 'Belum tersedia';
  const titleCase = value => String(value || '').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
  const nopName = value => titleCase(String(value || '').replace(/^NOP\s+/i, ''));
  const yesNo = value => value === null || value === undefined || value === '' ? 'Belum tersedia' : /^(yes|ya|true|1|active)$/i.test(String(value)) ? 'Ya' : 'Tidak';
  const tone = value => /gold/i.test(value) ? 'gold' : /closed|selesai|^ya$/i.test(value) ? 'green' : /submitted|approval|evaluasi/i.test(value) ? 'purple' : /take out|cancel|terlambat/i.test(value) ? 'red' : /silver/i.test(value) ? 'silver' : 'blue';
  const badge = value => <span className={`pm-site-badge is-${tone(String(value || ''))}`}>{display(value)}</span>;
  function Description({ detail }) {
    const total = detail.summary.incident_count + detail.summary.ggr_count;
    return <div className="pm-site-description"><strong>{!detail.pm.last_maintenance || detail.missing_sources.length ? 'Data belum cukup untuk menyimpulkan ada atau tidaknya gangguan.' : total ? `Terdapat ${total} indikasi gangguan pasca-maintenance yang perlu ditinjau.` : 'Tidak ditemukan indikasi gangguan pada sumber dan jendela waktu yang tersedia.'}</strong><p>Jendela evaluasi: setelah Last Maintenance sampai 30 hari. Hari 0 yang hanya memiliki tanggal membutuhkan konfirmasi urutan waktu.</p></div>;
  }
  const tags = values => <div className="flex flex-wrap gap-2 mt-2">{values.filter(Boolean).map((value, index) => <span key={index} className="pm-site-tag">{value}</span>)}</div>;
  const panel = (title, content) => <section className="corporate-panel p-4"><h3 className="section-title mb-3">{title}</h3>{content}</section>;
  const information = pairs => <dl className="pm-site-information">{pairs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl>;
  async function request(url, options) {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || 'Permintaan gagal.');
    return result;
  }
  function Location({ master }) {
    const lat = master?.latitude, lon = master?.longitude;
    const valid = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
    if (!valid) return <aside className="corporate-panel p-4 pm-site-map">Koordinat belum tersedia</aside>;
    const bbox = `${lon - .008},${lat - .005},${lon + .008},${lat + .005}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
    return <aside className="corporate-panel pm-site-map"><iframe title={`Lokasi ${master.site_id}`} src={src} loading="lazy" referrerPolicy="no-referrer" /><div className="p-3"><strong>{display(master.city)}</strong>{master.address && <p>{master.address}</p>}<p>{lat}, {lon}</p><a className="pm-site-link" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`} target="_blank" rel="noreferrer">Buka peta penuh ↗</a></div></aside>;
  }
  function Analysis({ detail, SummaryCard }) {
    const { summary, incidents } = detail;
    const cards = [
      ['GANGGUAN PASCA-MAINTENANCE', summary.incident_count, `${incidents.filter(row => row.type === 'SWFM Incident').length} Incident · ${incidents.filter(row => row.type === 'SWFM Event').length} Event · ${summary.ggr_count} GGR pendukung`, 'navy'],
      ['JEDA GANGGUAN PERTAMA', summary.first_delay === null ? 'Belum tersedia' : `${summary.first_delay} hari`, incidents.some(row => row.time_confirmation) ? 'Hari 0: urutan waktu perlu konfirmasi' : 'Dari maintenance sebelumnya', 'green'],
      ['TOTAL DOWNTIME', `${Math.round(summary.total_downtime_minutes * 100) / 100} menit`, summary.unknown_duration ? `${summary.unknown_duration} durasi belum tersedia; total parsial` : 'SWFM/INAP setelah deduplikasi', 'orange'],
      ['PRIORITAS EVALUASI', detail.priority, detail.priority_reasons.join(' '), 'red']
    ];
    return <div className="space-y-4"><div className="pm-site-cards">{cards.map(([label, value, note, color]) => <div className={`pm-site-kpi is-${color}`} key={label}><SummaryCard label={label} value={value} detail={note} tone={color} /></div>)}</div><section className="corporate-panel p-5 pm-site-timeline-panel"><div className="pm-site-timeline-heading"><h3 className="section-title">Timeline maintenance & gangguan</h3><span>Urutan berdasarkan waktu kejadian</span></div><ol className="pm-site-timeline">{detail.timeline.map((item, index) => {
      const color = item.label === 'Maintenance sebelumnya' ? 'green' : item.label === 'Hari ini' ? 'blue' : item.label === 'Jadwal PM berikutnya' ? 'orange' : 'red';
      return <li className={`is-${color}`} key={index}><span className="pm-site-timeline-dot" /><div className="pm-site-timeline-item"><span className="pm-site-timeline-kind">{item.label}</span><strong>{shortDate(item.date)}</strong>{item.date.length > 10 && <span>{item.date.slice(11, 16)}</span>}{item.ticket_no && <p>{item.ticket_no}</p>}</div></li>;
    })}</ol></section></div>;
  }
  function SiteInformation({ detail }) {
    const { pm, master, issues } = detail, m = master || {};
    const type = String(m.type_site || '').replace(/^\d+\.\s*/,'').replace(/TELKOMSEL\s*/i,'').replace(/\/Simpul Besar/i,'').trim();
    const rows = pairs => <dl className="pm-site-information">{pairs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
    return <div className="space-y-4">{issues.length > 0 && <div className="pm-site-validation">{issues.map(issue => <p key={issue}>{issue}</p>)}</div>}<div className="pm-site-two-columns">{panel('Ticket PM', rows([
      ['Status', badge(titleCase(pm.status))], ['Maintenance sebelumnya', shortDate(pm.last_maintenance)], ['Jadwal berikutnya', `${shortDate(pm.schedule_date)} · ${detail.schedule_label}`], ['Jeda maintenance', pm.diff_days ? `${pm.diff_days} hari` : 'Belum tersedia'], ['PIC', display(pm.pic)]
    ]))}{panel('Master site', rows([
      ['Class / Type', badge(`${display(m.class_site)} · ${display(type)}`)], ['Regional / NOP', `${display(m.regional).replace(/_/g,' ')} · ${nopName(m.nop) || 'Belum tersedia'}`], ['Cluster', String(m.cluster || '') ? 'TO ' + titleCase(String(m.cluster).replace(/^TO\s+/i,'')) : 'Belum tersedia'], ['Site aktif', badge(yesNo(m.active))], ['Genset aktif', yesNo(m.genset_active)], ['Owner', display(m.owner)]
    ]))}</div></div>;
  }
  class History extends R.Component {
    constructor(props) { super(props); this.state = { selected: null }; }
    render() {
    const { detail } = this.props;
    const selected = this.state.selected, setSelected = value => this.setState({ selected: value });
    const columns = ['Waktu', 'Ticket', 'Jenis', 'Durasi', 'Severity', 'RCA', 'SLA'];
    return <div className="space-y-4"><p className="text-[10px]">SWFM/INAP dengan nomor induk yang sama dihitung satu kejadian. GGR tetap ditampilkan sebagai bukti pendukung.</p><div className="overflow-x-auto corporate-panel"><table className="preventive-table pm-site-history"><thead className="bg-[#173E68] text-white"><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{detail.incidents.map(row => <tr key={row.id}><td>{date(row.occurred_at)}<p>{row.bucket}</p>{row.time_confirmation && <p>Urutan waktu perlu konfirmasi</p>}</td><td><button className="pm-site-link" onClick={() => setSelected(row)}>{row.ticket_no}</button></td><td>{row.type}<p>{row.lineage.map(item => item.source.toUpperCase()).join(' / ')}</p></td><td>{row.duration_minutes == null ? 'Belum tersedia' : `${Math.round(row.duration_minutes)} menit`}</td><td>{display(row.severity)}</td><td>{display(row.rc1)}<p>{row.category}</p></td><td>{display(row.sla)}</td></tr>)}</tbody></table>{!detail.incidents.length && <p className="p-4">Belum ada gangguan terkait dalam jendela evaluasi, atau data belum cukup.</p>}</div>{selected && panel(`Detail ticket ${selected.ticket_no}`, <div><button className="btn-secondary px-3 py-2 float-right" onClick={() => setSelected(null)}>Tutup detail ticket</button>{tags([selected.severity, selected.sla, selected.validated ? 'RCA tervalidasi' : 'RCA belum tervalidasi'])}{information([['Summary', selected.summary], ['RC1', selected.rc1], ['RC2', selected.rc2], ['Resolution Action', selected.resolution], ['Ticket terkait', selected.lineage.map(item => `${item.source.toUpperCase()}: ${item.ticket_no}`).join(' · ')]])}</div>)}</div>;
  }
  }
  class Evaluation extends R.Component {
    constructor(props) { super(props); const { detail } = props; this.state = { form: { ...emptyEvaluation, priority: detail.priority, ...(detail.evaluation || {}), target_date: detail.evaluation?.target_date?.slice(0, 10) || '' }, busy: false, error: '', notice: '' }; }
    render() {
    const { detail, onSaved } = this.props;
    const { form, busy, error, notice } = this.state;
    const setForm = value => this.setState(current => ({ form: typeof value === 'function' ? value(current.form) : value }));
    const setBusy = busy => this.setState({ busy }), setError = error => this.setState({ error }), setNotice = notice => this.setState({ notice });
    const change = (field, value) => setForm(current => ({ ...current, [field]: value }));
    async function save(event, reviewed = false) {
      event?.preventDefault(); setBusy(true); setError(''); setNotice('');
      try {
        const value = reviewed ? { ...form, evaluation_status: 'Sedang ditindaklanjuti' } : form;
        const saved = await request('/api/pm-site/evaluation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...value, id: `site|${detail.pm.ticket_no || `${detail.pm.site_id.trim().toUpperCase()}|${detail.pm.schedule_date}|${detail.pm.scope_item_name || ''}`}` }) });
        setForm({ ...saved, target_date: saved.target_date?.slice(0, 10) || '' }); setNotice('Evaluasi tersimpan di MySQL.'); onSaved(saved);
      } catch (failure) { setError(failure.message); } finally { setBusy(false); }
    }
    const field = (label, name, type = 'text') => <label className="pm-site-form-field"><span className="filter-label">{label}</span><input className="control p-2 text-[11px]" type={type} value={form[name] || ''} maxLength={255} onChange={event => change(name, event.target.value)} onInput={event => change(name, event.target.value)} /></label>;
    return panel('Hasil evaluasi internal', <form onSubmit={save}><p className="mb-4 text-[10px]">Evaluasi ini terpisah dari status PM dan ticket SWFM. Perubahan disimpan berdasarkan Site ID dan PM Ticket.</p>{detail.read_only && <p className="pm-site-banner">Preview read-only. Konfigurasikan MySQL untuk menyimpan dan mengedit evaluasi.</p>}{error && <p role="alert" className="pm-site-error">{error}</p>}{notice && <p role="status" className="pm-site-success">{notice}</p>}<div className="pm-site-two-columns"><label className="pm-site-form-field"><span className="filter-label">Status evaluasi</span><select className="control p-2" value={form.evaluation_status} onChange={event => change('evaluation_status', event.target.value)}>{statuses.map(value => <option key={value}>{value}</option>)}</select></label><label className="pm-site-form-field"><span className="filter-label">Prioritas</span><select className="control p-2" value={form.priority} onChange={event => change('priority', event.target.value)}>{['Rendah', 'Sedang', 'Tinggi'].map(value => <option key={value}>{value}</option>)}</select></label>{field('Evaluator / PIC', 'evaluator_pic')}{field('Target tindak lanjut', 'target_date', 'date')}</div>{[['Kesimpulan evaluasi', 'conclusion'], ['Tindak lanjut', 'follow_up_action'], ['Catatan verifikasi', 'verification_note']].map(([label, name]) => <label className="pm-site-form-field mt-3" key={name}><span className="filter-label">{label}</span><textarea className="control p-3 text-[11px]" rows="3" maxLength={10000} value={form[name]} onChange={event => change(name, event.target.value)} /></label>)}<div className="flex flex-wrap gap-2 mt-4"><button type="button" className="btn-secondary pm-site-evaluation-button px-4 py-2" disabled={busy || detail.read_only} onClick={event => save(event, true)}>Tandai sudah ditinjau</button><button className="btn-primary pm-site-evaluation-button px-4 py-2" disabled={busy || detail.read_only}>{busy ? 'Menyimpan…' : detail.evaluation ? 'Simpan perubahan evaluasi' : 'Simpan evaluasi'}</button>{detail.evaluation && <span className="text-[10px]">Diperbarui: {date(detail.evaluation.updated_at)}</span>}</div></form>);
  }
  }
  class Detail extends R.Component {
    constructor(props) { super(props); this.state = { tab: 0 }; }
    render() {
    const { detail, back, onSaved, SummaryCard } = this.props;
    const tab = this.state.tab, setTab = tab => this.setState({ tab });
    const labels = ['Analisis', 'Informasi PM & Site', 'Riwayat Gangguan', 'Hasil Evaluasi'];
    function keyboard(event, index) {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % 4;
      if (event.key === 'ArrowLeft') next = (index + 3) % 4;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 3;
      if (next !== undefined) { event.preventDefault(); setTab(next); document.getElementById(`pm-site-tab-${next}`).focus(); }
    }
    return <div className="space-y-4"><header className="pm-site-detail-header"><div className="pm-site-identity-column"><button className="pm-site-back" onClick={back}><span aria-hidden="true">←</span> Kembali ke PM Site</button><div className="pm-site-identity"><p className="pm-site-eyebrow">{detail.pm.site_id}</p><h2>{detail.master?.site_name || detail.pm.site_name}</h2><p className="pm-site-ticket">{display(detail.pm.ticket_no)}</p><div className="pm-site-inline-badges">{badge(titleCase(detail.pm.status))}{badge(detail.master?.class_site || detail.pm.class_site)}<span className="pm-site-tag">{detail.evaluation_label}</span></div><div className="pm-site-identity-meta"><span>{nopName(detail.master?.nop || detail.pm.nop)}</span><span>Jadwal {shortDate(detail.pm.schedule_date)} <strong>{detail.schedule_label}</strong></span></div></div></div><Location master={detail.master} /></header><Description detail={detail} /><div role="tablist" aria-label="Detail PM Site" className="pm-site-tabs">{labels.map((label, index) => <button key={label} id={`pm-site-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`pm-site-panel-${index}`} tabIndex={tab === index ? 0 : -1} onKeyDown={event => keyboard(event, index)} onClick={() => setTab(index)}>{label}</button>)}</div><div role="tabpanel" id={`pm-site-panel-${tab}`} aria-labelledby={`pm-site-tab-${tab}`}>{tab === 0 ? <Analysis detail={detail} SummaryCard={SummaryCard} /> : tab === 1 ? <SiteInformation detail={detail} /> : tab === 2 ? <History detail={detail} /> : <Evaluation detail={detail} onSaved={onSaved} />}</div></div>;
  }
  }
  class ImportSources extends R.Component {
    constructor(props) { super(props); this.state = { kind: 'master', file: null, dateValue: new Date().toISOString().slice(0, 10), busy: false, error: '' }; }
    render() {
    const { onImported, readOnly } = this.props;
    const { kind, file, dateValue, busy, error } = this.state;
    const setKind = kind => this.setState({ kind }), setFile = file => this.setState({ file }), setDate = dateValue => this.setState({ dateValue }), setBusy = busy => this.setState({ busy }), setError = error => this.setState({ error });
    async function upload(event) {
      event.preventDefault(); if (!file) { setError('Pilih file Excel.'); return; } setBusy(true); setError('');
      const form = new FormData(); form.append('file', file); form.append('upload_date', dateValue);
      try { await request(`/api/pm-site/sources/${kind}`, { method: 'POST', body: form }); onImported(); } catch (failure) { setError(failure.message); } finally { setBusy(false); }
    }
    return <details className="corporate-panel p-4"><summary className="section-title cursor-pointer">Data pendukung evaluasi PM Site</summary><p className="text-[10px] my-3">Upload PM Site melalui panel di atas. Impor master dan riwayat pendukung di sini.</p><form onSubmit={upload} className="flex flex-wrap gap-3 items-end"><label className="pm-site-form-field"><span className="filter-label">Sumber data</span><select className="control p-2" value={kind} onChange={event => setKind(event.target.value)}>{[['master', 'Master Site'], ['swfm', 'Ticket SWFM'], ['inap', 'Ticket INAP'], ['ggr', 'Genset Gagal Running']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="pm-site-form-field"><span className="filter-label">Tanggal upload</span><input className="control p-2" required type="date" value={dateValue} onChange={event => setDate(event.target.value)} onInput={event => setDate(event.target.value)} /></label><label className="pm-site-form-field"><span className="filter-label">File Excel</span><input className="control p-2" type="file" accept=".xlsx" onChange={event => setFile(event.target.files[0])} /></label><button className="btn-primary px-4 py-2" disabled={busy || readOnly}>{busy ? 'Mengimpor…' : 'Import sumber'}</button></form>{error && <p role="alert" className="pm-site-error">{error}</p>}</details>;
  }
  }
  window.PMSiteModule = class PMSiteModule extends R.Component {
    constructor(props) { super(props); const { filters } = props; this.state = { local: { date_from: filters.dateFrom || '', date_to: filters.dateTo || '', nop: '', regional: '', status: '', pic: '', interval: '', evaluation: '', incidents: '', search: filters.siteId || filters.search || '', schedule_state: '' }, data: null, detail: null, error: '', loading: false, page: 1, revision: 0 }; }
    componentDidMount() { this.active = true; this.refresh(); }
    componentDidUpdate(previousProps, previous) { if(previousProps.filters.dateFrom!==this.props.filters.dateFrom||previousProps.filters.dateTo!==this.props.filters.dateTo){this.setState(current=>({local:{...current.local,date_from:this.props.filters.dateFrom,date_to:this.props.filters.dateTo}}));return;} if (previous.local !== this.state.local || previous.revision !== this.state.revision || previousProps.pmData !== this.props.pmData) this.refresh(); }
    componentWillUnmount() { this.active = false; clearTimeout(this.timer); this.controller?.abort(); }
    refresh() {
      clearTimeout(this.timer); this.controller?.abort(); this.setState({ loading: true });
      this.controller = new AbortController(); const controller = this.controller;
      this.timer = setTimeout(() => request(`/api/pm-site?${new URLSearchParams(this.state.local)}`, { signal: controller.signal }).then(data => { if (this.active && !controller.signal.aborted) this.setState({ data, error: '', page: 1 }); }).catch(failure => { if (this.active && !controller.signal.aborted) this.setState({ error: failure.message }); }).finally(() => { if (this.active && !controller.signal.aborted) this.setState({ loading: false }); }), 180);
    }
    render() {
    const { local, data, detail, error, loading, page } = this.state;
    const { upload, pmData, UploadPanel, SummaryCard } = this.props;
    const setter = name => value => this.setState(current => ({ [name]: typeof value === 'function' ? value(current[name]) : value }));
    const setLocal = setter('local'), setDetail = setter('detail'), setError = setter('error'), setLoading = setter('loading'), setPage = setter('page'), setRevision = setter('revision');
    async function open(id) { setLoading(true); setError(''); try { setDetail(await request(`/api/pm-site/detail?${new URLSearchParams({ id })}`)); window.scrollTo({ top: 0 }); } catch (failure) { setError(failure.message); } finally { setLoading(false); } }
    const change = (name, value) => setLocal(current => ({ ...current, [name]: value }));
    const select = (label, name, values) => <label key={name} className="pm-site-form-field"><span className="filter-label">{label}</span><select className="control h-10 px-3 text-[10px] font-semibold" value={local[name]} onChange={event => change(name, event.target.value)}><option value="">Semua</option>{values.map(value => <option key={typeof value === 'string' ? value : value[0]} value={typeof value === 'string' ? value : value[0]}>{typeof value === 'string' ? value : value[1]}</option>)}</select></label>;
    if (detail) return <div className="pm-site-module">{error && <p role="alert" className="pm-site-error">{error}</p>}<Detail key={detail.pm.ticket_no} detail={detail} SummaryCard={SummaryCard} back={() => { setDetail(null); setRevision(value => value + 1); }} onSaved={saved => setDetail(current => ({ ...current, evaluation: saved, evaluation_label: saved.evaluation_status === 'Belum ditinjau' ? current.evaluation_label : 'Sudah dievaluasi' }))} /></div>;
    const rows = data?.rows || [], totalPages = Math.max(1, Math.ceil(rows.length / 50));
    const uniqueSites = values => new Set(values.map(row => row.site_id.trim().toUpperCase())).size;
    const plan = uniqueSites(rows), submitted = uniqueSites(rows.filter(row => row.submitted_date));
return <div className="pm-site-module space-y-4"><UploadPanel {...upload} latest={pmData?.latest_upload} label="PM SITE" /><div className="pm-site-cards"><SummaryCard label="PLAN SITE" value={plan} detail={`${shortDate(local.date_from)} sampai ${shortDate(local.date_to)}`} tone="navy" /><SummaryCard label="SUBMITTED" value={submitted} detail="Site unik dengan Submitted Date terisi" tone="green" /><SummaryCard label="ACHIEVEMENT" value={`${plan ? Math.round(submitted / plan * 10000) / 100 : 0}%`} detail="Submitted dibanding Plan pada filter aktif" tone="orange" /><SummaryCard label="BELUM SUBMIT" value={Math.max(0,plan - submitted)} detail="Site plan yang belum memiliki Submitted Date" tone="red" /></div>{data?.read_only && <p className="pm-site-banner">Preview memakai snapshot aktual. Konfigurasikan MySQL untuk import dan penyimpanan permanen.</p>}<section className="corporate-panel p-5"><div className="preventive-filter-row">{['date_from', 'date_to'].map(name => <label key={name} className="pm-site-form-field"><span className="filter-label">{name === 'date_from' ? 'DATE FROM' : 'DATE TO'}</span><input className="control h-10 px-3 text-[10px] font-semibold" type="date" value={local[name]} onChange={event => change(name, event.target.value)} onInput={event => change(name, event.target.value)} /></label>)}{select('NOP', 'nop', data?.options.nop || [])}{select('STATUS PM', 'status', data?.options.status || [])}{select('EVALUASI', 'evaluation', data?.options.evaluation || [])}<label className="pm-site-form-field preventive-filter-search"><span className="filter-label">CARI SITE</span><input className="control h-10 px-3 text-[10px]" value={local.search} onChange={event => change('search', event.target.value)} onInput={event => change('search', event.target.value)} placeholder="Cari Site ID atau Site Name" /></label></div><div className="pm-filter-charts"><window.PMAttentionCharts rows={rows} kind="site" loading={loading || !data} /></div>{error && <p role="alert" className="pm-site-error">{error}</p>}<div className="pm-site-list-heading"><h2 className="section-title">PM SITE - GENERAL INFORMATION</h2><p role="status" className="mt-1 text-[10px] text-slate-400">{loading ? 'Memuat…' : `Schedule ${shortDate(local.date_from)} sampai ${shortDate(local.date_to)} · Menampilkan ${Math.min(50, Math.max(0, rows.length - (page - 1) * 50))} dari ${rows.length} site`}</p></div><div className="preventive-card-list pm-site-work-list">{rows.slice((page - 1) * 50, page * 50).map(row => <button key={row.id} className="preventive-info-card pm-site-work-card" onClick={() => open(row.id)}><div className="preventive-card-head"><div className="preventive-card-section"><p className="preventive-card-label">SITE ID</p><p className="pm-site-work-value">{row.site_id}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">SITE NAME</p><p className="pm-site-work-value">{row.site_name}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">NOP</p><p className="pm-site-work-value">{nopName(row.nop)}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">PIC</p><p className="pm-site-work-value">{display(row.pic)}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">SCHEDULE</p><p className="pm-site-work-value">{shortDate(row.schedule_date)} · {row.schedule_label}</p></div><div className="preventive-card-section with-divider"><p className="preventive-card-label">STATUS PM</p><div className="pm-site-work-value"><div className="pm-card-statuses">{badge(titleCase(row.status))}<window.PMConditionBadge row={row}/></div></div></div><span className="preventive-card-chevron">›</span></div></button>)}</div>{!loading && !rows.length && <p className="p-4 text-[11px]">Tidak ada pekerjaan yang cocok dengan filter.</p>}<nav className="pm-work-pagination" aria-label="Navigasi daftar PM Site"><button className="pm-page-button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>← Sebelumnya</button><span className="pm-page-position">Halaman {page} / {totalPages}</span><button className="pm-page-button" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Berikutnya →</button></nav></section></div>;
    }
  };
})();
