(function() {
  const R = window.React;
  window.PMAttentionCharts = window.PMAttentionCharts || (() => null);
  const statuses = ["Belum ditinjau", "Perlu konfirmasi NOP", "Sedang ditindaklanjuti", "Menunggu verifikasi", "Selesai"];
  const emptyEvaluation = { evaluation_status: "Belum ditinjau", priority: "Rendah", evaluator_pic: "", target_date: "", conclusion: "", follow_up_action: "", verification_note: "" };
  const display = (value) => value === null || value === void 0 || value === "" ? "Belum tersedia" : String(value);
  const date = (value) => value ? value.replace("T", " ") : "Belum tersedia";
  const shortDate = (value) => value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(value.slice(0, 10) + "T00:00:00Z")) : "Belum tersedia";
  const titleCase = (value) => String(value || "").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const nopName = (value) => titleCase(String(value || "").replace(/^NOP\s+/i, ""));
  const yesNo = (value) => value === null || value === void 0 || value === "" ? "Belum tersedia" : /^(yes|ya|true|1|active)$/i.test(String(value)) ? "Ya" : "Tidak";
  const tone = (value) => /gold/i.test(value) ? "gold" : /closed|selesai|^ya$/i.test(value) ? "green" : /submitted|approval|evaluasi/i.test(value) ? "purple" : /take out|cancel|terlambat/i.test(value) ? "red" : /silver/i.test(value) ? "silver" : "blue";
  const badge = (value) => /* @__PURE__ */ R.createElement("span", { className: `pm-site-badge is-${tone(String(value || ""))}` }, display(value));
  function Description({ detail }) {
    const total = detail.summary.incident_count + detail.summary.ggr_count;
    return /* @__PURE__ */ R.createElement("div", { className: "pm-site-description" }, /* @__PURE__ */ R.createElement("strong", null, !detail.pm.last_maintenance || detail.missing_sources.length ? "Data belum cukup untuk menyimpulkan ada atau tidaknya gangguan." : total ? `Terdapat ${total} indikasi gangguan pasca-maintenance yang perlu ditinjau.` : "Tidak ditemukan indikasi gangguan pada sumber dan jendela waktu yang tersedia."), /* @__PURE__ */ R.createElement("p", null, "Jendela evaluasi: setelah Last Maintenance sampai 30 hari. Hari 0 yang hanya memiliki tanggal membutuhkan konfirmasi urutan waktu."));
  }
  const tags = (values) => /* @__PURE__ */ R.createElement("div", { className: "flex flex-wrap gap-2 mt-2" }, values.filter(Boolean).map((value, index) => /* @__PURE__ */ R.createElement("span", { key: index, className: "pm-site-tag" }, value)));
  const panel = (title, content) => /* @__PURE__ */ R.createElement("section", { className: "corporate-panel p-4" }, /* @__PURE__ */ R.createElement("h3", { className: "section-title mb-3" }, title), content);
  const information = (pairs) => /* @__PURE__ */ R.createElement("dl", { className: "pm-site-information" }, pairs.map(([label, value]) => /* @__PURE__ */ R.createElement("div", { key: label }, /* @__PURE__ */ R.createElement("dt", null, label), /* @__PURE__ */ R.createElement("dd", null, display(value)))));
  async function request(url, options) {
    const response = await fetch(url, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Permintaan gagal.");
    return result;
  }
  function Location({ master }) {
    const lat = master == null ? void 0 : master.latitude, lon = master == null ? void 0 : master.longitude;
    const valid = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
    if (!valid) return /* @__PURE__ */ R.createElement("aside", { className: "corporate-panel p-4 pm-site-map" }, "Koordinat belum tersedia");
    const bbox = `${lon - 8e-3},${lat - 5e-3},${lon + 8e-3},${lat + 5e-3}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
    return /* @__PURE__ */ R.createElement("aside", { className: "corporate-panel pm-site-map" }, /* @__PURE__ */ R.createElement("iframe", { title: `Lokasi ${master.site_id}`, src, loading: "lazy", referrerPolicy: "no-referrer" }), /* @__PURE__ */ R.createElement("div", { className: "p-3" }, /* @__PURE__ */ R.createElement("strong", null, display(master.city)), master.address && /* @__PURE__ */ R.createElement("p", null, master.address), /* @__PURE__ */ R.createElement("p", null, lat, ", ", lon), /* @__PURE__ */ R.createElement("a", { className: "pm-site-link", href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`, target: "_blank", rel: "noreferrer" }, "Buka peta penuh \u2197")));
  }
  function Analysis({ detail, SummaryCard }) {
    const { summary, incidents } = detail;
    const cards = [
      ["GANGGUAN PASCA-MAINTENANCE", summary.incident_count, `${incidents.filter((row) => row.type === "SWFM Incident").length} Incident \xB7 ${incidents.filter((row) => row.type === "SWFM Event").length} Event \xB7 ${summary.ggr_count} GGR pendukung`, "navy"],
      ["JEDA GANGGUAN PERTAMA", summary.first_delay === null ? "Belum tersedia" : `${summary.first_delay} hari`, incidents.some((row) => row.time_confirmation) ? "Hari 0: urutan waktu perlu konfirmasi" : "Dari maintenance sebelumnya", "green"],
      ["TOTAL DOWNTIME", `${Math.round(summary.total_downtime_minutes * 100) / 100} menit`, summary.unknown_duration ? `${summary.unknown_duration} durasi belum tersedia; total parsial` : "SWFM/INAP setelah deduplikasi", "orange"],
      ["PRIORITAS EVALUASI", detail.priority, detail.priority_reasons.join(" "), "red"]
    ];
    return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("div", { className: "pm-site-cards" }, cards.map(([label, value, note, color]) => /* @__PURE__ */ R.createElement("div", { className: `pm-site-kpi is-${color}`, key: label }, /* @__PURE__ */ R.createElement(SummaryCard, { label, value, detail: note, tone: color })))), /* @__PURE__ */ R.createElement("section", { className: "corporate-panel p-5 pm-site-timeline-panel" }, /* @__PURE__ */ R.createElement("div", { className: "pm-site-timeline-heading" }, /* @__PURE__ */ R.createElement("h3", { className: "section-title" }, "Timeline maintenance & gangguan"), /* @__PURE__ */ R.createElement("span", null, "Urutan berdasarkan waktu kejadian")), /* @__PURE__ */ R.createElement("ol", { className: "pm-site-timeline" }, detail.timeline.map((item, index) => {
      const color = item.label === "Maintenance sebelumnya" ? "green" : item.label === "Hari ini" ? "blue" : item.label === "Jadwal PM berikutnya" ? "orange" : "red";
      return /* @__PURE__ */ R.createElement("li", { className: `is-${color}`, key: index }, /* @__PURE__ */ R.createElement("span", { className: "pm-site-timeline-dot" }), /* @__PURE__ */ R.createElement("div", { className: "pm-site-timeline-item" }, /* @__PURE__ */ R.createElement("span", { className: "pm-site-timeline-kind" }, item.label), /* @__PURE__ */ R.createElement("strong", null, shortDate(item.date)), item.date.length > 10 && /* @__PURE__ */ R.createElement("span", null, item.date.slice(11, 16)), item.ticket_no && /* @__PURE__ */ R.createElement("p", null, item.ticket_no)));
    }))));
  }
  function SiteInformation({ detail }) {
    const { pm, master, issues } = detail, m = master || {};
    const type = String(m.type_site || "").replace(/^\d+\.\s*/, "").replace(/TELKOMSEL\s*/i, "").replace(/\/Simpul Besar/i, "").trim();
    const rows = (pairs) => /* @__PURE__ */ R.createElement("dl", { className: "pm-site-information" }, pairs.map(([label, value]) => /* @__PURE__ */ R.createElement("div", { key: label }, /* @__PURE__ */ R.createElement("dt", null, label), /* @__PURE__ */ R.createElement("dd", null, value))));
    return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, issues.length > 0 && /* @__PURE__ */ R.createElement("div", { className: "pm-site-validation" }, issues.map((issue) => /* @__PURE__ */ R.createElement("p", { key: issue }, issue))), /* @__PURE__ */ R.createElement("div", { className: "pm-site-two-columns" }, panel("Ticket PM", rows([
      ["Status", badge(titleCase(pm.status))],
      ["Maintenance sebelumnya", shortDate(pm.last_maintenance)],
      ["Jadwal berikutnya", `${shortDate(pm.schedule_date)} \xB7 ${detail.schedule_label}`],
      ["Jeda maintenance", pm.diff_days ? `${pm.diff_days} hari` : "Belum tersedia"],
      ["PIC", display(pm.pic)]
    ])), panel("Master site", rows([
      ["Class / Type", badge(`${display(m.class_site)} \xB7 ${display(type)}`)],
      ["Regional / NOP", `${display(m.regional).replace(/_/g, " ")} \xB7 ${nopName(m.nop) || "Belum tersedia"}`],
      ["Cluster", String(m.cluster || "") ? "TO " + titleCase(String(m.cluster).replace(/^TO\s+/i, "")) : "Belum tersedia"],
      ["Site aktif", badge(yesNo(m.active))],
      ["Genset aktif", yesNo(m.genset_active)],
      ["Owner", display(m.owner)]
    ]))));
  }
  class History extends R.Component {
    constructor(props) {
      super(props);
      this.state = { selected: null };
    }
    render() {
      const { detail } = this.props;
      const selected = this.state.selected, setSelected = (value) => this.setState({ selected: value });
      const columns = ["Waktu", "Ticket", "Jenis", "Durasi", "Severity", "RCA", "SLA"];
      return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("p", { className: "text-[10px]" }, "SWFM/INAP dengan nomor induk yang sama dihitung satu kejadian. GGR tetap ditampilkan sebagai bukti pendukung."), /* @__PURE__ */ R.createElement("div", { className: "overflow-x-auto corporate-panel" }, /* @__PURE__ */ R.createElement("table", { className: "preventive-table pm-site-history" }, /* @__PURE__ */ R.createElement("thead", { className: "bg-[#173E68] text-white" }, /* @__PURE__ */ R.createElement("tr", null, columns.map((column) => /* @__PURE__ */ R.createElement("th", { key: column }, column)))), /* @__PURE__ */ R.createElement("tbody", null, detail.incidents.map((row) => /* @__PURE__ */ R.createElement("tr", { key: row.id }, /* @__PURE__ */ R.createElement("td", null, date(row.occurred_at), /* @__PURE__ */ R.createElement("p", null, row.bucket), row.time_confirmation && /* @__PURE__ */ R.createElement("p", null, "Urutan waktu perlu konfirmasi")), /* @__PURE__ */ R.createElement("td", null, /* @__PURE__ */ R.createElement("button", { className: "pm-site-link", onClick: () => setSelected(row) }, row.ticket_no)), /* @__PURE__ */ R.createElement("td", null, row.type, /* @__PURE__ */ R.createElement("p", null, row.lineage.map((item) => item.source.toUpperCase()).join(" / "))), /* @__PURE__ */ R.createElement("td", null, row.duration_minutes == null ? "Belum tersedia" : `${Math.round(row.duration_minutes)} menit`), /* @__PURE__ */ R.createElement("td", null, display(row.severity)), /* @__PURE__ */ R.createElement("td", null, display(row.rc1), /* @__PURE__ */ R.createElement("p", null, row.category)), /* @__PURE__ */ R.createElement("td", null, display(row.sla)))))), !detail.incidents.length && /* @__PURE__ */ R.createElement("p", { className: "p-4" }, "Belum ada gangguan terkait dalam jendela evaluasi, atau data belum cukup.")), selected && panel(`Detail ticket ${selected.ticket_no}`, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("button", { className: "btn-secondary px-3 py-2 float-right", onClick: () => setSelected(null) }, "Tutup detail ticket"), tags([selected.severity, selected.sla, selected.validated ? "RCA tervalidasi" : "RCA belum tervalidasi"]), information([["Summary", selected.summary], ["RC1", selected.rc1], ["RC2", selected.rc2], ["Resolution Action", selected.resolution], ["Ticket terkait", selected.lineage.map((item) => `${item.source.toUpperCase()}: ${item.ticket_no}`).join(" \xB7 ")]]))));
    }
  }
  class Evaluation extends R.Component {
    constructor(props) {
      var _a, _b;
      super(props);
      const { detail } = props;
      this.state = { form: { ...emptyEvaluation, priority: detail.priority, ...detail.evaluation || {}, target_date: ((_b = (_a = detail.evaluation) == null ? void 0 : _a.target_date) == null ? void 0 : _b.slice(0, 10)) || "" }, busy: false, error: "", notice: "" };
    }
    render() {
      const { detail, onSaved } = this.props;
      const { form, busy, error, notice } = this.state;
      const setForm = (value) => this.setState((current) => ({ form: typeof value === "function" ? value(current.form) : value }));
      const setBusy = (busy2) => this.setState({ busy: busy2 }), setError = (error2) => this.setState({ error: error2 }), setNotice = (notice2) => this.setState({ notice: notice2 });
      const change = (field2, value) => setForm((current) => ({ ...current, [field2]: value }));
      async function save(event, reviewed = false) {
        var _a;
        event == null ? void 0 : event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");
        try {
          const value = reviewed ? { ...form, evaluation_status: "Sedang ditindaklanjuti" } : form;
          const saved = await request("/api/pm-site/evaluation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...value, id: `site|${detail.pm.ticket_no || `${detail.pm.site_id.trim().toUpperCase()}|${detail.pm.schedule_date}|${detail.pm.scope_item_name || ""}`}` }) });
          setForm({ ...saved, target_date: ((_a = saved.target_date) == null ? void 0 : _a.slice(0, 10)) || "" });
          setNotice("Evaluasi tersimpan di MySQL.");
          onSaved(saved);
        } catch (failure) {
          setError(failure.message);
        } finally {
          setBusy(false);
        }
      }
      const field = (label, name, type = "text") => /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("input", { className: "control p-2 text-[11px]", type, value: form[name] || "", maxLength: 255, onChange: (event) => change(name, event.target.value), onInput: (event) => change(name, event.target.value) }));
      return panel("Hasil evaluasi internal", /* @__PURE__ */ R.createElement("form", { onSubmit: save }, /* @__PURE__ */ R.createElement("p", { className: "mb-4 text-[10px]" }, "Evaluasi ini terpisah dari status PM dan ticket SWFM. Perubahan disimpan berdasarkan Site ID dan PM Ticket."), detail.read_only && /* @__PURE__ */ R.createElement("p", { className: "pm-site-banner" }, "Preview read-only. Konfigurasikan MySQL untuk menyimpan dan mengedit evaluasi."), error && /* @__PURE__ */ R.createElement("p", { role: "alert", className: "pm-site-error" }, error), notice && /* @__PURE__ */ R.createElement("p", { role: "status", className: "pm-site-success" }, notice), /* @__PURE__ */ R.createElement("div", { className: "pm-site-two-columns" }, /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "Status evaluasi"), /* @__PURE__ */ R.createElement("select", { className: "control p-2", value: form.evaluation_status, onChange: (event) => change("evaluation_status", event.target.value) }, statuses.map((value) => /* @__PURE__ */ R.createElement("option", { key: value }, value)))), /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "Prioritas"), /* @__PURE__ */ R.createElement("select", { className: "control p-2", value: form.priority, onChange: (event) => change("priority", event.target.value) }, ["Rendah", "Sedang", "Tinggi"].map((value) => /* @__PURE__ */ R.createElement("option", { key: value }, value)))), field("Evaluator / PIC", "evaluator_pic"), field("Target tindak lanjut", "target_date", "date")), [["Kesimpulan evaluasi", "conclusion"], ["Tindak lanjut", "follow_up_action"], ["Catatan verifikasi", "verification_note"]].map(([label, name]) => /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field mt-3", key: name }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("textarea", { className: "control p-3 text-[11px]", rows: "3", maxLength: 1e4, value: form[name], onChange: (event) => change(name, event.target.value) }))), /* @__PURE__ */ R.createElement("div", { className: "flex flex-wrap gap-2 mt-4" }, /* @__PURE__ */ R.createElement("button", { type: "button", className: "btn-secondary pm-site-evaluation-button px-4 py-2", disabled: busy || detail.read_only, onClick: (event) => save(event, true) }, "Tandai sudah ditinjau"), /* @__PURE__ */ R.createElement("button", { className: "btn-primary pm-site-evaluation-button px-4 py-2", disabled: busy || detail.read_only }, busy ? "Menyimpan\u2026" : detail.evaluation ? "Simpan perubahan evaluasi" : "Simpan evaluasi"), detail.evaluation && /* @__PURE__ */ R.createElement("span", { className: "text-[10px]" }, "Diperbarui: ", date(detail.evaluation.updated_at)))));
    }
  }
  class Detail extends R.Component {
    constructor(props) {
      super(props);
      this.state = { tab: 0 };
    }
    render() {
      var _a, _b, _c;
      const { detail, back, onSaved, SummaryCard } = this.props;
      const tab = this.state.tab, setTab = (tab2) => this.setState({ tab: tab2 });
      const labels = ["Analisis", "Informasi PM & Site", "Riwayat Gangguan", "Hasil Evaluasi"];
      function keyboard(event, index) {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % 4;
        if (event.key === "ArrowLeft") next = (index + 3) % 4;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = 3;
        if (next !== void 0) {
          event.preventDefault();
          setTab(next);
          document.getElementById(`pm-site-tab-${next}`).focus();
        }
      }
      return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("header", { className: "pm-site-detail-header" }, /* @__PURE__ */ R.createElement("div", { className: "pm-site-identity-column" }, /* @__PURE__ */ R.createElement("button", { className: "pm-site-back", onClick: back }, /* @__PURE__ */ R.createElement("span", { "aria-hidden": "true" }, "\u2190"), " Kembali ke PM Site"), /* @__PURE__ */ R.createElement("div", { className: "pm-site-identity" }, /* @__PURE__ */ R.createElement("p", { className: "pm-site-eyebrow" }, detail.pm.site_id), /* @__PURE__ */ R.createElement("h2", null, ((_a = detail.master) == null ? void 0 : _a.site_name) || detail.pm.site_name), /* @__PURE__ */ R.createElement("p", { className: "pm-site-ticket" }, display(detail.pm.ticket_no)), /* @__PURE__ */ R.createElement("div", { className: "pm-site-inline-badges" }, badge(titleCase(detail.pm.status)), badge(((_b = detail.master) == null ? void 0 : _b.class_site) || detail.pm.class_site), /* @__PURE__ */ R.createElement("span", { className: "pm-site-tag" }, detail.evaluation_label)), /* @__PURE__ */ R.createElement("div", { className: "pm-site-identity-meta" }, /* @__PURE__ */ R.createElement("span", null, nopName(((_c = detail.master) == null ? void 0 : _c.nop) || detail.pm.nop)), /* @__PURE__ */ R.createElement("span", null, "Jadwal ", shortDate(detail.pm.schedule_date), " ", /* @__PURE__ */ R.createElement("strong", null, detail.schedule_label))))), /* @__PURE__ */ R.createElement(Location, { master: detail.master })), /* @__PURE__ */ R.createElement(Description, { detail }), /* @__PURE__ */ R.createElement("div", { role: "tablist", "aria-label": "Detail PM Site", className: "pm-site-tabs" }, labels.map((label, index) => /* @__PURE__ */ R.createElement("button", { key: label, id: `pm-site-tab-${index}`, role: "tab", "aria-selected": tab === index, "aria-controls": `pm-site-panel-${index}`, tabIndex: tab === index ? 0 : -1, onKeyDown: (event) => keyboard(event, index), onClick: () => setTab(index) }, label))), /* @__PURE__ */ R.createElement("div", { role: "tabpanel", id: `pm-site-panel-${tab}`, "aria-labelledby": `pm-site-tab-${tab}` }, tab === 0 ? /* @__PURE__ */ R.createElement(Analysis, { detail, SummaryCard }) : tab === 1 ? /* @__PURE__ */ R.createElement(SiteInformation, { detail }) : tab === 2 ? /* @__PURE__ */ R.createElement(History, { detail }) : /* @__PURE__ */ R.createElement(Evaluation, { detail, onSaved })));
    }
  }
  class ImportSources extends R.Component {
    constructor(props) {
      super(props);
      this.state = { kind: "master", file: null, dateValue: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), busy: false, error: "" };
    }
    render() {
      const { onImported, readOnly } = this.props;
      const { kind, file, dateValue, busy, error } = this.state;
      const setKind = (kind2) => this.setState({ kind: kind2 }), setFile = (file2) => this.setState({ file: file2 }), setDate = (dateValue2) => this.setState({ dateValue: dateValue2 }), setBusy = (busy2) => this.setState({ busy: busy2 }), setError = (error2) => this.setState({ error: error2 });
      async function upload(event) {
        event.preventDefault();
        if (!file) {
          setError("Pilih file Excel.");
          return;
        }
        setBusy(true);
        setError("");
        const form = new FormData();
        form.append("file", file);
        form.append("upload_date", dateValue);
        try {
          await request(`/api/pm-site/sources/${kind}`, { method: "POST", body: form });
          onImported();
        } catch (failure) {
          setError(failure.message);
        } finally {
          setBusy(false);
        }
      }
      return /* @__PURE__ */ R.createElement("details", { className: "corporate-panel p-4" }, /* @__PURE__ */ R.createElement("summary", { className: "section-title cursor-pointer" }, "Data pendukung evaluasi PM Site"), /* @__PURE__ */ R.createElement("p", { className: "text-[10px] my-3" }, "Upload PM Site melalui panel di atas. Impor master dan riwayat pendukung di sini."), /* @__PURE__ */ R.createElement("form", { onSubmit: upload, className: "flex flex-wrap gap-3 items-end" }, /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "Sumber data"), /* @__PURE__ */ R.createElement("select", { className: "control p-2", value: kind, onChange: (event) => setKind(event.target.value) }, [["master", "Master Site"], ["swfm", "Ticket SWFM"], ["inap", "Ticket INAP"], ["ggr", "Genset Gagal Running"]].map(([value, label]) => /* @__PURE__ */ R.createElement("option", { key: value, value }, label)))), /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "Tanggal upload"), /* @__PURE__ */ R.createElement("input", { className: "control p-2", required: true, type: "date", value: dateValue, onChange: (event) => setDate(event.target.value), onInput: (event) => setDate(event.target.value) })), /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "File Excel"), /* @__PURE__ */ R.createElement("input", { className: "control p-2", type: "file", accept: ".xlsx", onChange: (event) => setFile(event.target.files[0]) })), /* @__PURE__ */ R.createElement("button", { className: "btn-primary px-4 py-2", disabled: busy || readOnly }, busy ? "Mengimpor\u2026" : "Import sumber")), error && /* @__PURE__ */ R.createElement("p", { role: "alert", className: "pm-site-error" }, error));
    }
  }
  window.PMSiteModule = class PMSiteModule extends R.Component {
    constructor(props) {
      super(props);
      const { filters } = props;
      this.state = { local: { date_from: filters.dateFrom || "", date_to: filters.dateTo || "", nop: "", regional: "", status: "", pic: "", interval: "", evaluation: "", incidents: "", search: filters.siteId || filters.search || "", schedule_state: "" }, data: null, detail: null, error: "", loading: false, page: 1, revision: 0 };
    }
    componentDidMount() {
      this.active = true;
      this.refresh();
    }
    componentDidUpdate(previousProps, previous) {
      if (previousProps.filters.dateFrom !== this.props.filters.dateFrom || previousProps.filters.dateTo !== this.props.filters.dateTo) {
        this.setState((current) => ({ local: { ...current.local, date_from: this.props.filters.dateFrom, date_to: this.props.filters.dateTo } }));
        return;
      }
      if (previous.local !== this.state.local || previous.revision !== this.state.revision || previousProps.pmData !== this.props.pmData) this.refresh();
    }
    componentWillUnmount() {
      var _a;
      this.active = false;
      clearTimeout(this.timer);
      (_a = this.controller) == null ? void 0 : _a.abort();
    }
    refresh() {
      var _a;
      clearTimeout(this.timer);
      (_a = this.controller) == null ? void 0 : _a.abort();
      this.setState({ loading: true });
      this.controller = new AbortController();
      const controller = this.controller;
      this.timer = setTimeout(() => request(`/api/pm-site?${new URLSearchParams(this.state.local)}`, { signal: controller.signal }).then((data) => {
        if (this.active && !controller.signal.aborted) this.setState({ data, error: "", page: 1 });
      }).catch((failure) => {
        if (this.active && !controller.signal.aborted) this.setState({ error: failure.message });
      }).finally(() => {
        if (this.active && !controller.signal.aborted) this.setState({ loading: false });
      }), 180);
    }
    render() {
      const { local, data, detail, error, loading, page } = this.state;
      const { upload, pmData, UploadPanel, SummaryCard } = this.props;
      const setter = (name) => (value) => this.setState((current) => ({ [name]: typeof value === "function" ? value(current[name]) : value }));
      const setLocal = setter("local"), setDetail = setter("detail"), setError = setter("error"), setLoading = setter("loading"), setPage = setter("page"), setRevision = setter("revision");
      async function open(id) {
        setLoading(true);
        setError("");
        try {
          setDetail(await request(`/api/pm-site/detail?${new URLSearchParams({ id })}`));
          window.scrollTo({ top: 0 });
        } catch (failure) {
          setError(failure.message);
        } finally {
          setLoading(false);
        }
      }
      const change = (name, value) => setLocal((current) => ({ ...current, [name]: value }));
      const select = (label, name, values) => /* @__PURE__ */ R.createElement("label", { key: name, className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("select", { className: "control h-10 px-3 text-[10px] font-semibold", value: local[name], onChange: (event) => change(name, event.target.value) }, /* @__PURE__ */ R.createElement("option", { value: "" }, "Semua"), values.map((value) => /* @__PURE__ */ R.createElement("option", { key: typeof value === "string" ? value : value[0], value: typeof value === "string" ? value : value[0] }, typeof value === "string" ? value : value[1]))));
      if (detail) return /* @__PURE__ */ R.createElement("div", { className: "pm-site-module" }, error && /* @__PURE__ */ R.createElement("p", { role: "alert", className: "pm-site-error" }, error), /* @__PURE__ */ R.createElement(Detail, { key: detail.pm.ticket_no, detail, SummaryCard, back: () => {
        setDetail(null);
        setRevision((value) => value + 1);
      }, onSaved: (saved) => setDetail((current) => ({ ...current, evaluation: saved, evaluation_label: saved.evaluation_status === "Belum ditinjau" ? current.evaluation_label : "Sudah dievaluasi" })) }));
      const rows = (data == null ? void 0 : data.rows) || [], totalPages = Math.max(1, Math.ceil(rows.length / 50));
      const uniqueSites = (values) => new Set(values.map((row) => row.site_id.trim().toUpperCase())).size;
      const plan = uniqueSites(rows), submitted = uniqueSites(rows.filter((row) => row.submitted_date));
      return /* @__PURE__ */ R.createElement("div", { className: "pm-site-module space-y-4" }, /* @__PURE__ */ R.createElement(UploadPanel, { ...upload, latest: pmData == null ? void 0 : pmData.latest_upload, label: "PM SITE" }), /* @__PURE__ */ R.createElement("div", { className: "pm-site-cards" }, /* @__PURE__ */ R.createElement(SummaryCard, { label: "PLAN SITE", value: plan, detail: `${shortDate(local.date_from)} sampai ${shortDate(local.date_to)}`, tone: "navy" }), /* @__PURE__ */ R.createElement(SummaryCard, { label: "SUBMITTED", value: submitted, detail: "Site unik dengan Submitted Date terisi", tone: "green" }), /* @__PURE__ */ R.createElement(SummaryCard, { label: "ACHIEVEMENT", value: `${plan ? Math.round(submitted / plan * 1e4) / 100 : 0}%`, detail: "Submitted dibanding Plan pada filter aktif", tone: "orange" }), /* @__PURE__ */ R.createElement(SummaryCard, { label: "BELUM SUBMIT", value: Math.max(0, plan - submitted), detail: "Site plan yang belum memiliki Submitted Date", tone: "red" })), (data == null ? void 0 : data.read_only) && /* @__PURE__ */ R.createElement("p", { className: "pm-site-banner" }, "Preview memakai snapshot aktual. Konfigurasikan MySQL untuk import dan penyimpanan permanen."), /* @__PURE__ */ R.createElement("section", { className: "corporate-panel p-5" }, /* @__PURE__ */ R.createElement("div", { className: "preventive-filter-row" }, ["date_from", "date_to"].map((name) => /* @__PURE__ */ R.createElement("label", { key: name, className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, name === "date_from" ? "DATE FROM" : "DATE TO"), /* @__PURE__ */ R.createElement("input", { className: "control h-10 px-3 text-[10px] font-semibold", type: "date", value: local[name], onChange: (event) => change(name, event.target.value), onInput: (event) => change(name, event.target.value) }))), select("NOP", "nop", (data == null ? void 0 : data.options.nop) || []), select("STATUS PM", "status", (data == null ? void 0 : data.options.status) || []), select("EVALUASI", "evaluation", (data == null ? void 0 : data.options.evaluation) || []), /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field preventive-filter-search" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "CARI SITE"), /* @__PURE__ */ R.createElement("input", { className: "control h-10 px-3 text-[10px]", value: local.search, onChange: (event) => change("search", event.target.value), onInput: (event) => change("search", event.target.value), placeholder: "Cari Site ID atau Site Name" }))), /* @__PURE__ */ R.createElement("div", { className: "pm-filter-charts" }, /* @__PURE__ */ R.createElement(window.PMAttentionCharts, { rows, kind: "site", loading: loading || !data })), error && /* @__PURE__ */ R.createElement("p", { role: "alert", className: "pm-site-error" }, error), /* @__PURE__ */ R.createElement("div", { className: "pm-site-list-heading" }, /* @__PURE__ */ R.createElement("h2", { className: "section-title" }, "PM SITE - GENERAL INFORMATION"), /* @__PURE__ */ R.createElement("p", { role: "status", className: "mt-1 text-[10px] text-slate-400" }, loading ? "Memuat\u2026" : `Schedule ${shortDate(local.date_from)} sampai ${shortDate(local.date_to)} \xB7 Menampilkan ${Math.min(50, Math.max(0, rows.length - (page - 1) * 50))} dari ${rows.length} site`)), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-list pm-site-work-list" }, rows.slice((page - 1) * 50, page * 50).map((row) => /* @__PURE__ */ R.createElement("button", { key: row.id, className: "preventive-info-card pm-site-work-card", onClick: () => open(row.id) }, /* @__PURE__ */ R.createElement("div", { className: "preventive-card-head" }, /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "SITE ID"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-work-value" }, row.site_id)), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section with-divider" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "SITE NAME"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-work-value" }, row.site_name)), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section with-divider" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "NOP"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-work-value" }, nopName(row.nop))), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section with-divider" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "PIC"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-work-value" }, display(row.pic))), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section with-divider" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "SCHEDULE"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-work-value" }, shortDate(row.schedule_date), " \xB7 ", row.schedule_label)), /* @__PURE__ */ R.createElement("div", { className: "preventive-card-section with-divider" }, /* @__PURE__ */ R.createElement("p", { className: "preventive-card-label" }, "STATUS PM"), /* @__PURE__ */ R.createElement("div", { className: "pm-site-work-value" }, /* @__PURE__ */ R.createElement("div", { className: "pm-card-statuses" }, badge(titleCase(row.status)), /* @__PURE__ */ R.createElement(window.PMConditionBadge, { row })))), /* @__PURE__ */ R.createElement("span", { className: "preventive-card-chevron" }, "\u203A"))))), !loading && !rows.length && /* @__PURE__ */ R.createElement("p", { className: "p-4 text-[11px]" }, "Tidak ada pekerjaan yang cocok dengan filter."), /* @__PURE__ */ R.createElement("nav", { className: "pm-work-pagination", "aria-label": "Navigasi daftar PM Site" }, /* @__PURE__ */ R.createElement("button", { className: "pm-page-button", disabled: page <= 1, onClick: () => setPage((value) => value - 1) }, "\u2190 Sebelumnya"), /* @__PURE__ */ R.createElement("span", { className: "pm-page-position" }, "Halaman ", page, " / ", totalPages), /* @__PURE__ */ R.createElement("button", { className: "pm-page-button", disabled: page >= totalPages, onClick: () => setPage((value) => value + 1) }, "Berikutnya \u2192"))));
    }
  };
})();
