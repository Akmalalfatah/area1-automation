(function() {
  const R = window.React;
  const workStatusTone = (status) => /REJECT|CANCEL|TAKE.?OUT/.test(String(status).toUpperCase()) ? "red" : /CLOSED|COMPLETED/.test(String(status).toUpperCase()) ? "green" : /SUBMIT|APPROVAL/.test(String(status).toUpperCase()) ? "purple" : /PROGRESS/.test(String(status).toUpperCase()) ? "orange" : /ASSIGNED/.test(String(status).toUpperCase()) ? "navy" : "gray";
  window.PMWorkStatus = function({ status }) {
    return /* @__PURE__ */ R.createElement("span", { className: "pm-work-status is-" + workStatusTone(status) }, status);
  };
  window.PMConditionBadge = function({ row }) {
    return /* @__PURE__ */ R.createElement("span", { className: "pm-condition-badge is-" + (row.condition_tone || "gray"), title: "Kondisi berdasarkan sumber dan jendela evaluasi tersedia" }, row.condition_label || "Belum dapat dievaluasi");
  };
  window.PMAttentionCharts = function({ rows = [], loading }) {
    const normalize = (row) => String(row.status || "").toUpperCase().replace(/[ _-]/g, "");
    const unfinished = rows.filter((row) => !["CLOSED", "COMPLETED", "TAKEOUT", "CANCELED", "CANCELLED"].includes(normalize(row)));
    const groups = {};
    unfinished.forEach((row) => {
      const label = row.status || "Status belum tersedia";
      groups[label] = (groups[label] || 0) + 1;
    });
    const statuses = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const palette = ["#c87519", "#173e68", "#7653b4", "#269b9b", "#d64b55", "#8997aa", "#aa79cc", "#618bc0"];
    const now = /* @__PURE__ */ new Date(), today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const nopGroups = {};
    unfinished.forEach((row) => {
      const rejected = normalize(row) === "REJECTED";
      const late = !row.submitted_date && !/SUBMIT|APPROVAL/.test(normalize(row)) && row.schedule_date && row.schedule_date < today;
      if (!rejected && !late) return;
      const label = String(row.nop || "NOP belum tersedia").replace(/^NOP\s+/i, "").replace(/_/g, " ");
      const item = nopGroups[label] || (nopGroups[label] = { label, late: 0, rejected: 0 });
      if (rejected) item.rejected++;
      else item.late++;
    });
    const priorities = Object.values(nopGroups).sort((a, b) => b.late + b.rejected - (a.late + a.rejected));
    const top = priorities.slice(0, 6), totalProblems = priorities.reduce((n, row) => n + row.late + row.rejected, 0);
    const axisMax = Math.max(5, Math.ceil(Math.max(0, ...top.map((row) => row.late + row.rejected)) / 5) * 5);
    const monthLabel = (value2) => new Intl.DateTimeFormat("id-ID", { month: "long" }).format(/* @__PURE__ */ new Date(value2 + "-01T00:00:00"));
    const monthlyMap = {};
    unfinished.forEach((row) => {
      const month = String(row.schedule_date || row.submitted_date || "").slice(0, 7);
      if (!month) return;
      const item = monthlyMap[month] || { month, total: 0, counts: {} };
      const label = row.status || "Status belum tersedia";
      item.total++;
      item.counts[label] = (item.counts[label] || 0) + 1;
      monthlyMap[month] = item;
    });
    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    const statusBars = /* @__PURE__ */ R.createElement("div", { className: "pm-status-bar-layout" }, /* @__PURE__ */ R.createElement("div", { className: "pm-status-month-bars", role: "img", "aria-label": "Komposisi status pekerjaan per bulan" }, monthly.map((item) => /* @__PURE__ */ R.createElement("div", { className: "pm-status-month", key: item.month }, /* @__PURE__ */ R.createElement("div", { className: "pm-status-month-track" }, statuses.map(([label], i) => item.counts[label] ? /* @__PURE__ */ R.createElement("div", { key: label, className: "pm-status-month-segment", title: `${monthLabel(item.month)} - ${label}: ${item.counts[label]} pekerjaan`, style: { height: `${item.counts[label] / item.total * 100}%`, flex: `0 0 ${item.counts[label] / item.total * 100}%`, background: palette[i % palette.length] } }) : null)), /* @__PURE__ */ R.createElement("span", null, monthLabel(item.month))))), /* @__PURE__ */ R.createElement("ul", { className: "pm-chart-legend pm-status-detail" }, statuses.map(([label, count], i) => /* @__PURE__ */ R.createElement("li", { key: label }, /* @__PURE__ */ R.createElement("i", { style: { background: palette[i % palette.length] } }), /* @__PURE__ */ R.createElement("span", null, label.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())), /* @__PURE__ */ R.createElement("strong", null, count, /* @__PURE__ */ R.createElement("small", null, (count / unfinished.length * 100).toFixed(1), "%"))))));
    const graph = /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bars", role: "img", "aria-label": "Enam NOP dengan pekerjaan terlambat atau rejected terbanyak" }, top.map((row) => {
      const total = row.late + row.rejected;
      return /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bar-row", key: row.label }, /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bar-head" }, /* @__PURE__ */ R.createElement("span", null, row.label), /* @__PURE__ */ R.createElement("strong", null, total)), /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bar-track" }, /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bar-late", style: { width: `${row.late / axisMax * 100}%` } }), /* @__PURE__ */ R.createElement("div", { className: "pm-priority-bar-rejected", style: { width: `${row.rejected / axisMax * 100}%` } })));
    }), /* @__PURE__ */ R.createElement("div", { className: "pm-priority-axis" }, /* @__PURE__ */ R.createElement("span", null, "0"), /* @__PURE__ */ R.createElement("span", null, axisMax)));
    return /* @__PURE__ */ R.createElement("div", { className: "pm-attention-grid" }, /* @__PURE__ */ R.createElement("section", { className: "corporate-panel pm-attention-panel" }, /* @__PURE__ */ R.createElement("div", { className: "pm-attention-heading" }, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("p", null, "PEKERJAAN BELUM SELESAI"), /* @__PURE__ */ R.createElement("h3", null, "Komposisi status PM"))), loading ? /* @__PURE__ */ R.createElement("p", { className: "pm-attention-note" }, "Memuat grafik\u2026") : unfinished.length ? statusBars : /* @__PURE__ */ R.createElement("p", { className: "pm-chart-empty" }, "Tidak ada pekerjaan aktif yang belum selesai.")), /* @__PURE__ */ R.createElement("section", { className: "corporate-panel pm-attention-panel" }, /* @__PURE__ */ R.createElement("div", { className: "pm-attention-heading" }, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("p", null, "PRIORITAS EVALUASI"), /* @__PURE__ */ R.createElement("h3", null, "NOP dengan kendala terbanyak"))), /* @__PURE__ */ R.createElement("div", { className: "pm-chart-key" }, /* @__PURE__ */ R.createElement("span", null, /* @__PURE__ */ R.createElement("i", { style: { background: "#d64b55" } }), "Lewat jadwal \xB7 belum submit"), /* @__PURE__ */ R.createElement("span", null, /* @__PURE__ */ R.createElement("i", { style: { background: "#c87519" } }), "Rejected")), loading ? /* @__PURE__ */ R.createElement("p", { className: "pm-attention-note" }, "Memuat grafik\u2026") : top.length ? graph : /* @__PURE__ */ R.createElement("p", { className: "pm-chart-empty" }, "Tidak ada pekerjaan terlambat atau rejected pada filter ini.")));
  };
  const unavailable = "Data belum tersedia";
  const value = (v) => v === null || v === void 0 || v === "" || v === "-" ? unavailable : String(v);
  const number = (v) => v === null || v === void 0 ? unavailable : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(v);
  const date = (v) => v ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(v.slice(0, 10) + "T00:00:00Z")) : unavailable;
  const timestamp = (v) => v ? `${date(v)}${v.length > 10 ? " \xB7 " + v.slice(11, 16) : ""}` : unavailable;
  const statusOptions = ["Belum dievaluasi", "Perlu ditinjau", "Terverifikasi bermasalah", "Tidak berkaitan dengan PM", "Menunggu verifikasi lapangan", "Selesai dievaluasi"];
  const tone = (v) => /Out SLA|Tinggi|bermasalah/i.test(v) ? "red" : /stabil|In SLA|Selesai dievaluasi|^Ya$/i.test(v) ? "green" : /belum|tersedia|^Tidak$/i.test(v) ? "gray" : "orange";
  const tag = (v, color) => /* @__PURE__ */ R.createElement("span", { className: `genset-tag is-${color || tone(value(v))}` }, value(v));
  const panel = (title, children) => /* @__PURE__ */ R.createElement("section", { className: "corporate-panel genset-panel" }, /* @__PURE__ */ R.createElement("h3", { className: "section-title" }, title), children);
  const fields = (pairs) => /* @__PURE__ */ R.createElement("dl", { className: "genset-fields" }, pairs.map(([label, item]) => /* @__PURE__ */ R.createElement("div", { key: label }, /* @__PURE__ */ R.createElement("dt", null, label), /* @__PURE__ */ R.createElement("dd", null, item === null || item === void 0 || item === "" ? unavailable : item))));
  async function request(url, options) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw Error(data.detail || "Permintaan gagal.");
    return data;
  }
  function Map({ master }) {
    const lat = master == null ? void 0 : master.latitude, lon = master == null ? void 0 : master.longitude;
    const valid = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
    if (!valid) return /* @__PURE__ */ R.createElement("aside", { className: "corporate-panel genset-map genset-empty" }, "Koordinat belum tersedia");
    const bbox = `${lon - 8e-3},${lat - 5e-3},${lon + 8e-3},${lat + 5e-3}`;
    return /* @__PURE__ */ R.createElement("aside", { className: "corporate-panel genset-map" }, /* @__PURE__ */ R.createElement("div", { className: "genset-map-viewport" }, /* @__PURE__ */ R.createElement("iframe", { title: `Lokasi genset ${master.site_id}`, src: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`, loading: "eager", referrerPolicy: "no-referrer" })), /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("strong", null, value(master.city || master.province)), /* @__PURE__ */ R.createElement("span", null, lat, ", ", lon), /* @__PURE__ */ R.createElement("a", { className: "pm-site-link", href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`, target: "_blank", rel: "noreferrer" }, "Buka peta penuh \u2197")));
  }
  function Comparison({ metric }) {
    const max = Math.max(metric.before || 0, metric.after || 0);
    return /* @__PURE__ */ R.createElement("article", { className: "corporate-panel genset-comparison" }, /* @__PURE__ */ R.createElement("h4", null, metric.label), /* @__PURE__ */ R.createElement("div", { className: "genset-comparison-values" }, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("span", null, "Sebelum"), /* @__PURE__ */ R.createElement("strong", null, number(metric.before))), /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("span", null, "Sesudah"), /* @__PURE__ */ R.createElement("strong", null, number(metric.after)))), /* @__PURE__ */ R.createElement("div", { className: "genset-bars" }, [["Sebelum", metric.before, "before"], ["Sesudah", metric.after, "after"]].map(([label, v, period]) => /* @__PURE__ */ R.createElement("div", { key: period }, /* @__PURE__ */ R.createElement("span", null, label), /* @__PURE__ */ R.createElement("div", { className: "genset-bar-track" }, /* @__PURE__ */ R.createElement("span", { className: `is-${period}`, style: { width: v === null ? "0%" : max ? `${v / max * 100}%` : "0%" } }))))), /* @__PURE__ */ R.createElement("div", { className: "genset-comparison-footer" }, tag(metric.change, metric.change === "Meningkat" ? "orange" : metric.change === "Menurun" ? "green" : "gray"), /* @__PURE__ */ R.createElement("span", null, metric.zero_baseline ? "Muncul setelah PM" : metric.percent !== null ? `${metric.percent > 0 ? "+" : ""}${number(metric.percent)}%` : metric.before === 0 && metric.after === 0 ? "Tidak ada kejadian tercatat" : metric.complete ? "" : "Persentase belum dapat dievaluasi")), /* @__PURE__ */ R.createElement("p", null, metric.unit, " \xB7 ", metric.complete ? "Cakupan terkonfirmasi" : "Cakupan/durasi/SLA perlu konfirmasi"));
  }
  class Timeline extends R.Component {
    constructor(props) {
      super(props);
      this.state = { selected: null };
    }
    componentDidUpdate(previous) {
      if (previous.detail.rules.windowDays !== this.props.detail.rules.windowDays) this.setState({ selected: null });
    }
    render() {
      const { detail } = this.props, { selected } = this.state;
      const rows = [...detail.anchor ? [{ id: "pm", occurred_at: detail.anchor, kind: "PM", ticket_no: detail.pm.ticket_no, duration_minutes: null }] : [], ...detail.events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
      const max = Math.max(0, ...rows.filter((row) => row.kind === "GGR").map((row) => row.duration_minutes || 0));
      return panel("Timeline durasi GGR", /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("div", { className: "genset-legend" }, tag("PM", "navy"), tag("GGR", "orange"), tag("Ticket Power In SLA", "green"), tag("Ticket Power Out SLA", "red"), tag("SLA / durasi belum tersedia", "gray")), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "Blok GGR membandingkan durasi dalam menit. Ticket yang berdekatan membutuhkan verifikasi evaluator."), /* @__PURE__ */ R.createElement("div", { className: "genset-timeline" }, rows.map((row) => {
        var _a;
        const color = row.kind === "PM" ? "navy" : row.kind === "GGR" ? "orange" : row.sla_state === "Out SLA" ? "red" : row.sla_state === "In SLA" ? "green" : "gray";
        const related = ((_a = (detail.timeline_related || detail.related).find((item) => item.ggr_id === row.id)) == null ? void 0 : _a.ticket_ids) || [];
        return /* @__PURE__ */ R.createElement("button", { key: row.id, className: `genset-event is-${color}`, "aria-expanded": (selected == null ? void 0 : selected.id) === row.id, onClick: () => this.setState({ selected: (selected == null ? void 0 : selected.id) === row.id ? null : row }) }, /* @__PURE__ */ R.createElement("span", { className: "genset-event-date" }, timestamp(row.occurred_at)), /* @__PURE__ */ R.createElement("span", { className: "genset-event-content" }, /* @__PURE__ */ R.createElement("strong", null, row.kind === "PM" ? detail.anchor_label === "setelah PM selesai" ? "Closed PM" : "Submission PM" : row.kind), /* @__PURE__ */ R.createElement("span", null, value(row.ticket_no), row.period ? " \xB7 " + row.period : ""), row.kind === "GGR" ? /* @__PURE__ */ R.createElement("span", { className: "genset-duration-track" }, row.duration_minutes === null ? /* @__PURE__ */ R.createElement("span", { className: "genset-note" }, "Durasi belum tersedia") : /* @__PURE__ */ R.createElement("span", { style: { width: max ? `${Math.max(2, row.duration_minutes / max * 100)}%` : "0%" } })) : null, /* @__PURE__ */ R.createElement("span", null, row.kind === "GGR" ? `${number(row.duration_minutes)}${row.duration_minutes === null ? "" : " menit"} \xB7 ${related.length} ticket Power berdekatan` : row.kind === "PM" ? "Acuan evaluasi" : value(row.sla_state))));
      })), !rows.length && /* @__PURE__ */ R.createElement("p", { className: "genset-empty" }, "Belum cukup bukti untuk timeline."), selected && /* @__PURE__ */ R.createElement("div", { className: "genset-selected" }, /* @__PURE__ */ R.createElement("strong", null, value(selected.ticket_no)), fields([["Waktu", timestamp(selected.occurred_at)], ["Jenis", selected.kind], ["Durasi", selected.kind === "PM" ? "Acuan evaluasi" : selected.duration_minutes === null ? unavailable : `${number(selected.duration_minutes)} menit`], ["RCA tercatat", value(selected.rc1 || selected.rc_category)], ["Resolution", value(selected.resolution)]]), selected.kind === "GGR" && /* @__PURE__ */ R.createElement("p", null, "Ticket Power berdekatan: ", detail.events.filter((row) => {
        var _a;
        return (((_a = (detail.timeline_related || detail.related).find((item) => item.ggr_id === selected.id)) == null ? void 0 : _a.ticket_ids) || []).includes(row.id);
      }).map((row) => row.ticket_no).join(", ") || "Bukti belum cukup"))));
    }
  }
  function Analysis({ detail, SummaryCard }) {
    const r = detail.reliability;
    if (!detail.anchor) {
      const { pm, master } = detail, m = master || {};
      const yesNo = (v) => v === "" || v === void 0 || v === null ? unavailable : /true|yes|^ya$|^1$/i.test(String(v)) ? "Ya" : "Tidak";
      const readiness = [
        ["STATUS PM", value(pm.status), "Status pekerjaan dari RAW PM", "navy"],
        ["SUMBER DAYA", value(pm.type_power), "Peran kelistrikan pada site", "orange"],
        ["KAPASITAS GENSET", m.genset_capacity > 0 ? number(m.genset_capacity) : unavailable, "Kapasitas dari Master Site", "green"],
        ["GENSET AKTIF", yesNo(m.genset_active), "Kesiapan aset dari Master Site", "red"]
      ];
      return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("div", { className: "genset-readiness is-gray" }, /* @__PURE__ */ R.createElement("strong", null, "Ringkasan kesiapan PM Genset"), /* @__PURE__ */ R.createElement("p", null, "Evaluasi menampilkan data pekerjaan dan aset kelistrikan yang tersedia. Perbandingan gangguan sebelum dan sesudah PM baru ditampilkan jika waktu pelaksanaan PM tersedia."), /* @__PURE__ */ R.createElement("span", null, "Fokus pada status pekerjaan, fungsi daya, spesifikasi genset, jadwal, dan PIC")), /* @__PURE__ */ R.createElement("div", { className: "genset-grid-four" }, readiness.map(([label, v, detailText, color]) => /* @__PURE__ */ R.createElement(SummaryCard, { key: label, label, value: v, detail: detailText, tone: color }))), panel("Kesiapan operasional genset", fields([["Tipe Genset", value(m.genset_type || pm.type_power)], ["Sistem Power", value(pm.scope_item_name || m.type_power)], ["Kapasitas", m.genset_capacity > 0 ? `${number(m.genset_capacity)} kVA` : unavailable], ["Maintenance Terakhir", date(m.genset_last_maintenance || pm.last_maintenance)], ["Jadwal PM", date(pm.schedule_date)], ["PIC PM", String(pm.pic || "").trim() || "Belum ditugaskan"], ["Interval PM", value(pm.interval)], ["Site ID", value(pm.site_id)], ["Regional / NOP", `${value(m.regional || pm.regional)} \xB7 ${value(m.nop || pm.nop)}`]])));
    }
    return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("div", { className: `genset-readiness is-${tone(detail.priority)}` }, /* @__PURE__ */ R.createElement("strong", null, detail.status), /* @__PURE__ */ R.createElement("p", null, detail.reasons.join(" ")), /* @__PURE__ */ R.createElement("span", null, detail.anchor_label, " \xB7 ", detail.rules.windowDays, " hari per jendela \xB7 prioritas ", detail.priority)), panel("Perbandingan sebelum & sesudah PM", /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, detail.windows ? `${date(detail.windows.before_start)} hingga sebelum ${timestamp(detail.windows.before_end)} \xB7 sesudah ${timestamp(detail.windows.after_start)} hingga sebelum ${timestamp(detail.windows.after_end)}` : "Acuan PM belum tersedia."), detail.date_only && /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "Hari submission dikeluarkan karena urutan waktu belum diketahui."), /* @__PURE__ */ R.createElement("div", { className: "genset-grid-four" }, detail.metrics.map((metric) => /* @__PURE__ */ R.createElement(Comparison, { key: metric.label, metric }))))), /* @__PURE__ */ R.createElement("div", { className: "genset-grid-four" }, [["MENUJU GGR PERTAMA", r.first_ggr_days, "hari"], ["JEDA RATA-RATA ANTAR-GGR", r.average_gap_days, "hari"], ["DURASI GGR TERLAMA", r.longest_minutes, "menit"], ["SEJAK GGR TERAKHIR", r.days_since_last, "hari"]].map(([label, v, unit], i) => /* @__PURE__ */ R.createElement(SummaryCard, { key: label, label, value: v === null ? unavailable : `${number(v)} ${unit}`, detail: "GGR pada jendela sesudah acuan PM", tone: ["navy", "green", "orange", "red"][i] }))), /* @__PURE__ */ R.createElement(Timeline, { detail }), panel("Hubungan bukti operasional", /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("div", { className: "genset-evidence-flow" }, [["GGR pasca-PM", detail.anchor && detail.coverage.ggr.available ? detail.evidence.ggr : null], ["Ticket Power terkait", detail.anchor && (detail.coverage.swfm.available || detail.coverage.inap.available) ? detail.evidence.related_power : null], ["Ticket Out SLA", detail.anchor && (detail.coverage.swfm.available || detail.coverage.inap.available) ? detail.evidence.out_sla : null], ["Prioritas", detail.priority]].map(([label, v], i) => /* @__PURE__ */ R.createElement("div", { key: label }, /* @__PURE__ */ R.createElement("span", null, label), /* @__PURE__ */ R.createElement("strong", null, typeof v === "number" || v === null ? number(v) : v), i < 3 && /* @__PURE__ */ R.createElement("span", { className: "genset-flow-arrow", "aria-hidden": "true" }, "\u2192")))), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "Site ID sama, RCA/kategori Power tercatat, dan selisih waktu \xB1", detail.rules.nearHours, " jam atau interval ticket mencakup GGR. Hubungan ini bersifat indikatif."))), panel("Ringkasan evaluasi sistem", /* @__PURE__ */ R.createElement("div", { className: "genset-grid-two" }, [["Fakta", detail.facts], ["Indikasi", detail.reasons], ["Bukti yang belum tersedia", detail.unavailable], ["Aksi yang disarankan", detail.actions]].map(([label, items]) => /* @__PURE__ */ R.createElement("section", { className: "genset-summary", key: label }, /* @__PURE__ */ R.createElement("h4", null, label), /* @__PURE__ */ R.createElement("ul", null, items.map((item, i) => /* @__PURE__ */ R.createElement("li", { key: i }, item))))))), panel("Aturan & cakupan evaluasi", /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "GGR dalam ", detail.rules.earlyDays, " hari, peningkatan jumlah/durasi, atau pengulangan \u2192 perlu ditinjau. GGR dengan ticket terkait Out SLA \u2192 prioritas tinggi. Stabil hanya jika cakupan sumber dikonfirmasi. Tidak ada skor atau keputusan RCA otomatis."), fields(Object.entries(detail.coverage).map(([source, c]) => [source.toUpperCase(), `${c.available ? "Sumber tersedia" : "Data belum tersedia"} \xB7 ${c.full ? "Dua jendela terkonfirmasi" : "Cakupan belum terkonfirmasi"}${c.observed ? " \xB7 kejadian tercatat " + date(c.observed.start) + " - " + date(c.observed.end) : ""}`])))));
  }
  function Information({ detail }) {
    const { pm, master } = detail, m = master || {};
    const active = (v) => v === "" || v === void 0 || v === null ? unavailable : /true|yes|^ya$|^1$|aktif/i.test(String(v)) ? "Aktif" : "Tidak aktif";
    const pic = String(pm.pic || "").trim() || "Belum ditugaskan";
    return /* @__PURE__ */ R.createElement("div", { className: "genset-grid-two" }, panel("Profil Genset", fields([["Status Genset", tag(active(m.genset_active))], ["Tipe Genset", value(m.genset_type || pm.type_power)], ["Kapasitas", m.genset_capacity > 0 ? `${number(m.genset_capacity)} kVA` : unavailable], ["Sistem Power", value(pm.scope_item_name || m.type_power)], ["Maintenance Terakhir", date(m.genset_last_maintenance || pm.last_maintenance)]])), panel("Informasi Ticket PM", fields([["Ticket PM", value(pm.ticket_no)], ["Jadwal PM", date(pm.schedule_date)], ["Status", tag(pm.status)], ["PIC PM", pic], ["Interval PM", value(pm.interval)]])));
  }
  class History extends R.Component {
    constructor(props) {
      super(props);
      this.state = { period: "", source: "", sla: "", severity: "", kind: "", selected: null };
    }
    render() {
      const { detail } = this.props, s = this.state;
      const select = (label, name, options) => /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("select", { className: "control p-2", value: s[name], onChange: (e) => this.setState({ [name]: e.target.value }) }, /* @__PURE__ */ R.createElement("option", { value: "" }, "Semua"), options.map((v) => /* @__PURE__ */ R.createElement("option", { key: v }, v))));
      const rows = detail.events.filter((row) => (!s.period || row.period === s.period) && (!s.source || row.lineage.some((item) => item.source.toUpperCase() === s.source)) && (!s.sla || row.sla_state === s.sla) && (!s.severity || value(row.severity) === s.severity) && (!s.kind || row.kind === s.kind));
      return /* @__PURE__ */ R.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ R.createElement("div", { className: "corporate-panel genset-history-filters" }, select("PERIODE", "period", ["Sebelum", "Sesudah", "Hari PM \xB7 perlu konfirmasi"]), select("SUMBER", "source", ["GGR", "SWFM", "INAP"]), select("SLA", "sla", ["In SLA", "Out SLA", unavailable]), select("SEVERITY", "severity", [...new Set(detail.events.map((row) => value(row.severity)))]), select("JENIS", "kind", ["GGR", "Ticket Power"])), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, rows.length, " kejadian tercatat pada dua jendela dan hari PM. Ticket SWFM/INAP dengan parent sama digabung; GGR tetap terpisah."), /* @__PURE__ */ R.createElement("div", { className: "corporate-panel genset-table-scroll" }, /* @__PURE__ */ R.createElement("table", { className: "preventive-table genset-history" }, /* @__PURE__ */ R.createElement("thead", { className: "bg-[#173E68] text-white" }, /* @__PURE__ */ R.createElement("tr", null, ["Waktu kejadian", "Jenis", "Sumber", "Durasi", "Ticket INAP", "Ticket WFM", "Severity", "Status", "SLA", "RCA", "Resolution category", "PIC"].map((label) => /* @__PURE__ */ R.createElement("th", { key: label }, label)))), /* @__PURE__ */ R.createElement("tbody", null, rows.map((row) => /* @__PURE__ */ R.createElement("tr", { key: row.id }, /* @__PURE__ */ R.createElement("td", null, timestamp(row.occurred_at), /* @__PURE__ */ R.createElement("small", null, row.period)), /* @__PURE__ */ R.createElement("td", null, row.kind, row.kind === "GGR" && /* @__PURE__ */ R.createElement("small", null, row.ticket_no)), /* @__PURE__ */ R.createElement("td", null, row.lineage.map((item) => item.source.toUpperCase()).join(" / ")), /* @__PURE__ */ R.createElement("td", null, row.duration_minutes === null ? unavailable : `${number(row.duration_minutes)} menit`), /* @__PURE__ */ R.createElement("td", null, row.lineage.filter((item) => item.source === "inap").map((item) => item.ticket_no).join(", ") || value(row.parent_ticket)), /* @__PURE__ */ R.createElement("td", null, row.lineage.filter((item) => item.source === "swfm").map((item) => /* @__PURE__ */ R.createElement("button", { key: item.ticket_no, className: "pm-site-link", onClick: () => this.setState({ selected: row }) }, item.ticket_no)), !row.lineage.some((item) => item.source === "swfm") && unavailable), /* @__PURE__ */ R.createElement("td", null, value(row.severity)), /* @__PURE__ */ R.createElement("td", null, value(row.status)), /* @__PURE__ */ R.createElement("td", null, tag(row.sla_state)), /* @__PURE__ */ R.createElement("td", null, value(row.rc1 || row.rc_category)), /* @__PURE__ */ R.createElement("td", null, value(row.resolution_category)), /* @__PURE__ */ R.createElement("td", null, value(row.pic)))))), !rows.length && /* @__PURE__ */ R.createElement("p", { className: "genset-empty" }, detail.anchor ? "Tidak ada kejadian yang sesuai filter pada sumber tersedia." : "Belum dapat dievaluasi: acuan PM belum tersedia.")), s.selected && panel("Detail ticket " + s.selected.ticket_no, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("button", { className: "pm-site-back", onClick: () => this.setState({ selected: null }) }, "Tutup detail"), fields([["Summary", value(s.selected.summary)], ["RCA tercatat", value(s.selected.rc1)], ["Resolution action", value(s.selected.resolution)], ["Ticket terkait", s.selected.lineage.map((item) => `${item.source.toUpperCase()}: ${item.ticket_no}`).join(" \xB7 ")]]), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "Deep link ticket belum tersedia pada sumber; detail sumber ditampilkan di sini."))));
    }
  }
  class Evaluation extends R.Component {
    constructor(props) {
      var _a, _b;
      super(props);
      this.state = { form: { evaluation_status: "Belum dievaluasi", follow_up_pic: "", conclusion: "", follow_up_action: "", target_date: "", additional_note: "", ...props.detail.evaluation, target_date: ((_b = (_a = props.detail.evaluation) == null ? void 0 : _a.target_date) == null ? void 0 : _b.slice(0, 10)) || "" }, busy: false, error: "", notice: "" };
    }
    async save(event) {
      var _a;
      event.preventDefault();
      this.setState({ busy: true, error: "", notice: "" });
      try {
        const saved = await request("/api/pm-genset/evaluation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...this.state.form, id: this.props.detail.id }) });
        this.setState({ form: { ...saved, target_date: ((_a = saved.target_date) == null ? void 0 : _a.slice(0, 10)) || "" }, notice: "Hasil evaluasi tersimpan di MySQL." });
        this.props.onSaved(saved);
      } catch (error) {
        this.setState({ error: error.message });
      } finally {
        this.setState({ busy: false });
      }
    }
    render() {
      const { form, busy, error, notice } = this.state, { detail } = this.props;
      const change = (name, v) => this.setState((current) => ({ form: { ...current.form, [name]: v } }));
      return panel("Hasil evaluasi manual", /* @__PURE__ */ R.createElement("form", { onSubmit: (e) => this.save(e) }, /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, "Diisi evaluator. Terhubung dengan ", detail.pm.site_id, ", ticket ", value(detail.pm.ticket_no), ", dan periode PM ", date(detail.pm.schedule_date), ". Status resmi ticket tetap berasal dari sumber."), detail.read_only && /* @__PURE__ */ R.createElement("p", { className: "pm-site-banner" }, "Preview read-only. MySQL diperlukan untuk menyimpan hasil evaluasi."), error && /* @__PURE__ */ R.createElement("p", { className: "pm-site-error", role: "alert" }, error), notice && /* @__PURE__ */ R.createElement("p", { className: "pm-site-success", role: "status" }, notice), /* @__PURE__ */ R.createElement("div", { className: "genset-grid-two" }, /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field" }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, "Status evaluasi"), /* @__PURE__ */ R.createElement("select", { className: "control p-2", value: form.evaluation_status, onChange: (e) => change("evaluation_status", e.target.value) }, statusOptions.map((v) => /* @__PURE__ */ R.createElement("option", { key: v }, v)))), [["PIC tindak lanjut", "follow_up_pic", "text"], ["Target penyelesaian", "target_date", "date"]].map(([label, name, type]) => /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field", key: name }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("input", { className: "control p-2", type, maxLength: 255, value: form[name], onChange: (e) => change(name, e.target.value), onInput: (e) => change(name, e.target.value) })))), [["Kesimpulan evaluator", "conclusion"], ["Aksi tindak lanjut", "follow_up_action"], ["Catatan tambahan", "additional_note"]].map(([label, name]) => /* @__PURE__ */ R.createElement("label", { className: "pm-site-form-field mt-3", key: name }, /* @__PURE__ */ R.createElement("span", { className: "filter-label" }, label), /* @__PURE__ */ R.createElement("textarea", { className: "control p-3", rows: "3", maxLength: 1e4, value: form[name], onChange: (e) => change(name, e.target.value), onInput: (e) => change(name, e.target.value) }))), /* @__PURE__ */ R.createElement("div", { className: "genset-evaluation-actions" }, /* @__PURE__ */ R.createElement("button", { className: "btn-primary pm-site-evaluation-button px-4 py-2", disabled: busy || detail.read_only || !detail.pm.ticket_no }, busy ? "Menyimpan\u2026" : "Simpan hasil evaluasi"), /* @__PURE__ */ R.createElement("span", null, form.updated_at ? "Diperbarui " + timestamp(form.updated_at) : "Belum ada evaluasi manual tersimpan"))));
    }
  }
  class Detail extends R.Component {
    constructor(props) {
      super(props);
      this.state = { tab: 0 };
    }
    render() {
      var _a;
      const { detail, back, onSaved, onWindow, SummaryCard } = this.props, { tab } = this.state, { pm, master } = detail, m = master || {}, labels = ["Analisis", "Informasi PM & Genset", "Riwayat Gangguan", "Hasil Evaluasi"];
      const keyDown = (e, i) => {
        const next = e.key === "ArrowRight" ? (i + 1) % 4 : e.key === "ArrowLeft" ? (i + 3) % 4 : e.key === "Home" ? 0 : e.key === "End" ? 3 : null;
        if (next !== null) {
          e.preventDefault();
          this.setState({ tab: next });
          document.getElementById("genset-tab-" + next).focus();
        }
      };
      return /* @__PURE__ */ R.createElement("div", { className: "genset-detail space-y-4" }, /* @__PURE__ */ R.createElement("header", { className: "genset-header" }, /* @__PURE__ */ R.createElement("div", { className: "genset-identity" }, /* @__PURE__ */ R.createElement("button", { className: "pm-site-back", onClick: back }, "\u2190 Kembali ke PM Genset"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-eyebrow" }, pm.site_id), /* @__PURE__ */ R.createElement("h2", null, value(m.site_name || pm.site_name)), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, value(pm.ticket_no)), /* @__PURE__ */ R.createElement("div", { className: "genset-header-tags" }, tag("PM Genset", "navy"), tag(m.genset_capacity > 0 ? `${number(m.genset_capacity)} kVA` : unavailable, "gray"), tag(pm.status), tag(((_a = detail.evaluation) == null ? void 0 : _a.evaluation_status) || "Belum dievaluasi"), tag(/backup/i.test(pm.type_power) ? "Backup Power" : /main/i.test(pm.type_power) ? "Main Power" : value(pm.type_power), "navy")), /* @__PURE__ */ R.createElement("p", { className: "genset-region" }, value(m.nop || pm.nop), " \xB7 ", value(m.regional || pm.regional).replace(/_/g, " "))), /* @__PURE__ */ R.createElement(Map, { master })), /* @__PURE__ */ R.createElement("div", { className: "genset-window" }, detail.anchor ? /* @__PURE__ */ R.createElement(React.Fragment, null, /* @__PURE__ */ R.createElement("span", null, "Acuan: ", timestamp(detail.anchor), " \xB7 ", detail.anchor_label), /* @__PURE__ */ R.createElement("label", null, "Jendela perbandingan ", /* @__PURE__ */ R.createElement("select", { className: "control", "aria-label": "Jendela perbandingan genset", value: detail.rules.windowDays, onChange: (e) => onWindow(Number(e.target.value)) }, [.../* @__PURE__ */ new Set([detail.rules.windowDays, 7, 14, 30])].sort((a, b) => a - b).map((v) => /* @__PURE__ */ R.createElement("option", { key: v, value: v }, v, " hari"))))) : /* @__PURE__ */ R.createElement("span", null, "Fokus evaluasi: kesiapan pekerjaan dan aset kelistrikan genset")), /* @__PURE__ */ R.createElement("div", { className: "pm-site-tabs", role: "tablist", "aria-label": "Detail PM Genset" }, labels.map((label, i) => /* @__PURE__ */ R.createElement("button", { id: "genset-tab-" + i, key: label, role: "tab", "aria-selected": tab === i, "aria-controls": "genset-panel-" + i, tabIndex: tab === i ? 0 : -1, onClick: () => this.setState({ tab: i }), onKeyDown: (e) => keyDown(e, i) }, label))), /* @__PURE__ */ R.createElement("div", { role: "tabpanel", id: "genset-panel-" + tab, "aria-labelledby": "genset-tab-" + tab }, tab === 0 ? /* @__PURE__ */ R.createElement(Analysis, { detail, SummaryCard }) : tab === 1 ? /* @__PURE__ */ R.createElement(Information, { detail }) : tab === 2 ? /* @__PURE__ */ R.createElement(History, { detail }) : /* @__PURE__ */ R.createElement(Evaluation, { detail, onSaved })));
    }
  }
  class Workspace extends R.Component {
    constructor(props) {
      super(props);
      this.state = { detail: null, selected: null, windowDays: null, error: "", loading: false };
      this.sequence = 0;
    }
    componentWillUnmount() {
      this.sequence++;
    }
    async open(row, windowDays = this.state.windowDays) {
      const token = ++this.sequence;
      this.setState({ loading: true, error: "", selected: row, windowDays });
      const id = `genset|${String(row.ticket_no || "").trim() || `${String(row.site_id).trim().toUpperCase()}|${row.schedule_date}|${row.scope_item_name || ""}`}`;
      try {
        const params = new URLSearchParams({ id });
        if (windowDays !== null) params.set("window_days", windowDays);
        const detail = await request("/api/pm-genset/detail?" + params);
        if (token === this.sequence) this.setState({ detail, windowDays: detail.rules.windowDays }, () => window.scrollTo({ top: 0, behavior: "auto" }));
      } catch (error) {
        if (token === this.sequence) this.setState({ error: error.message });
      } finally {
        if (token === this.sequence) this.setState({ loading: false });
      }
    }
    render() {
      const { RoutinePage, SummaryCard, ...props } = this.props, s = this.state;
      return /* @__PURE__ */ R.createElement("div", { className: "genset-workspace" }, s.error && /* @__PURE__ */ R.createElement("p", { className: "pm-site-error", role: "alert" }, s.error), s.loading && /* @__PURE__ */ R.createElement("p", { className: "genset-note", role: "status" }, "Memuat evaluasi genset\u2026"), s.detail ? /* @__PURE__ */ R.createElement(Detail, { detail: s.detail, SummaryCard, back: () => {
        this.sequence++;
        this.setState({ detail: null, selected: null, error: "", loading: false });
      }, onWindow: (days) => this.open(s.selected, days), onSaved: (evaluation) => this.setState((current) => ({ detail: { ...current.detail, evaluation } })) }) : /* @__PURE__ */ R.createElement(RoutinePage, { ...props, onOpenGenset: (row) => this.open(row) }));
    }
  }
  window.PMGensetWorkspace = Workspace;
})();
