(function() {
  const R = window.React;
  R.Fragment = R.Fragment || "div";
  const workStatusTone = (status) => /REJECT|CANCEL|TAKE.?OUT/.test(String(status).toUpperCase()) ? "red" : /CLOSED|COMPLETED/.test(String(status).toUpperCase()) ? "green" : /SUBMIT|APPROVAL/.test(String(status).toUpperCase()) ? "purple" : /PROGRESS/.test(String(status).toUpperCase()) ? "orange" : /ASSIGNED/.test(String(status).toUpperCase()) ? "navy" : "gray";
  window.PMWorkStatus = function({ status }) {
    return /* @__PURE__ */ R.createElement("span", { className: "pm-work-status is-" + workStatusTone(status) }, status);
  };
  window.PMConditionBadge = function({ row }) {
    return /* @__PURE__ */ R.createElement("span", { className: "pm-condition-badge is-" + (row.condition_tone || "gray"), title: "Kondisi berdasarkan sumber dan jendela evaluasi tersedia" }, row.condition_label || "Belum dapat dievaluasi");
  };
  const STATUS_COLORS = ["#173e68", "#c47b2b", "#7255b3", "#4c9899", "#c75358", "#8b99aa", "#4b8d68", "#6686bb", "#a85f8e"];
  const numberFormat = new Intl.NumberFormat("id-ID");
  const titleCase = (value2) => String(value2 || "Status belum tersedia").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  const percentOf = (part, whole) => (part / Math.max(whole, 1) * 100).toFixed(1).replace(".", ",") + "%";
  const splitLabel = (text, limit = 13) => {
    const value2 = String(text), words = value2.split(" ");
    if (value2.length <= limit || words.length < 2) return [value2];
    let best = 1, gap = Infinity;
    for (let index = 1; index < words.length; index++) {
      const left = words.slice(0, index).join(" ").length, right = words.slice(index).join(" ").length;
      if (Math.abs(left - right) < gap) {
        gap = Math.abs(left - right);
        best = index;
      }
    }
    return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  };
  const niceScale = (peak) => {
    const step = [5, 10, 20, 25, 50, 100, 200, 500, 1e3].find((item) => item * 4 >= peak) || Math.ceil(peak / 4);
    return { step, max: step * 4 };
  };
  const RADAR = { cx: 260, cy: 200, radius: 120, labelRatio: 1.16 };
  function buildModel(rows) {
    const groups = {};
    rows.forEach((row) => {
      const label = row.status || "Status belum tersedia";
      groups[label] = (groups[label] || 0) + 1;
    });
    const statuses = Object.entries(groups).sort((a, b) => b[1] - a[1]), total = rows.length;
    const source = rows.find((row) => row.schedule_date || row.submitted_date) || {}, periodKey = String(source.schedule_date || source.submitted_date || "").slice(0, 7);
    const period = periodKey ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(/* @__PURE__ */ new Date(periodKey + "-01T00:00:00Z")) : "Periode aktif";
    const sumOf = (pattern) => statuses.filter(([label]) => pattern.test(label)).reduce((sum, [, value2]) => sum + value2, 0);
    const completed = sumOf(/closed|completed/i), active = sumOf(/submitted|progress|assigned|new/i), waiting = sumOf(/waiting|approval/i), exception = sumOf(/take out|rejected/i);
    const statusChips = [
      ["Selesai", completed, percentOf(completed, total), "Closed dan Completed"],
      ["Masih berjalan", active, percentOf(active, total), "Submitted, Progress, Assigned, New"],
      ["Menunggu approval", waiting, percentOf(waiting, total), "Waiting Approval"],
      ["Take Out dan Rejected", exception, percentOf(exception, total), "Perlu tindak lanjut"]
    ];
    const normalized = (row) => String(row.status || "").toUpperCase().replace(/[ _-]/g, "");
    const now = /* @__PURE__ */ new Date(), today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-"), nop = {};
    rows.forEach((row) => {
      const state = normalized(row), rejected = state === "REJECTED", late = !row.submitted_date && !/SUBMIT|APPROVAL|CLOSED|COMPLETED/.test(state) && row.schedule_date && row.schedule_date < today;
      if (!rejected && !late) return;
      const name = String(row.nop || "NOP belum tersedia").replace(/^NOP\s+/i, "").replace(/_/g, " ");
      const item = nop[name] || (nop[name] = { name, value: 0 });
      item.value++;
    });
    const everyNop = Object.values(nop).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)), top = everyNop.slice(0, 8);
    const totalIssues = everyNop.reduce((sum, item) => sum + item.value, 0), average = top.length ? top.reduce((sum, item) => sum + item.value, 0) / top.length : 0;
    const scale = niceScale(Math.max(1, ...top.map((item) => item.value)));
    const lowest = top.length ? top[top.length - 1] : null;
    const nopChips = [
      ["Total kendala", numberFormat.format(totalIssues), "", `pada ${everyNop.length} NOP`],
      ["Tertinggi", top.length ? top[0].value : 0, "", top.length ? top[0].name : "-"],
      ["Terendah", lowest ? lowest.value : 0, "", lowest ? `${lowest.name}, dari ${top.length} teratas` : "-"]
    ];
    return {
      statuses,
      total,
      period,
      periodKey,
      statusChips,
      top,
      everyNop,
      totalIssues,
      average,
      scale,
      nopChips,
      averageLabel: average.toFixed(1).replace(".", ","),
      definition: "Kendala = PM berstatus Rejected, atau sudah lewat jadwal tetapi belum submit."
    };
  }
  const radarPoint = (model, index, value2) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(model.top.length, 3), radius = RADAR.radius * value2 / model.scale.max;
    return [RADAR.cx + Math.cos(angle) * radius, RADAR.cy + Math.sin(angle) * radius, angle];
  };
  function radarLabel(model, index) {
    const [lx, ly, angle] = radarPoint(model, index, model.scale.max * RADAR.labelRatio), lines = splitLabel(model.top[index].name), sine = Math.sin(angle), cosine = Math.cos(angle);
    const anchor = cosine > 0.3 ? "start" : cosine < -0.3 ? "end" : "middle", height = lines.length * 13 + 18;
    const top = sine < -0.5 ? ly - height : sine > 0.5 ? ly : ly - height / 2;
    return { x: lx, anchor, lines, top, numberY: top + lines.length * 13 + 15, nameY: top + 10 };
  }
  async function loadImageFonts() {
    try {
      if (document.fonts && document.fonts.load) await Promise.all(["400", "500", "600"].map((weight) => document.fonts.load(`${weight} 16px Poppins`)));
    } catch (error) {
    }
  }
  const FONT = "Poppins, 'Segoe UI', Arial, sans-serif";
  function put(context, text, x, y, { size = 14, weight = 500, color = "#243a55", align = "left", spacing = 0, halo = "" } = {}) {
    context.font = `${weight} ${size}px ${FONT}`;
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = "alphabetic";
    if ("letterSpacing" in context) context.letterSpacing = spacing ? `${spacing}px` : "0px";
    if (halo) {
      context.lineWidth = 4;
      context.lineJoin = "round";
      context.strokeStyle = halo;
      context.strokeText(text, x, y);
    }
    context.fillText(text, x, y);
    if ("letterSpacing" in context) context.letterSpacing = "0px";
  }
  function wrapText(context, text, maxWidth) {
    const words = String(text).split(" "), lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? line + " " + word : word;
      if (context.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line) lines.push(line);
    return lines;
  }
  function drawChips(context, chips, x, y, width, height, gap = 12) {
    const cell = (width - gap * (chips.length - 1)) / chips.length;
    chips.forEach(([label, value2, percent, description], index) => {
      const left = x + index * (cell + gap);
      context.fillStyle = "#f1f5f9";
      context.fillRect(left, y, cell, height);
      put(context, label.toUpperCase(), left + 14, y + 22, { size: 10.5, weight: 600, color: "#6d7d90", spacing: 0.5 });
      put(context, String(value2), left + 14, y + 55, { size: 28, weight: 600, color: "#173e68" });
      if (percent) put(context, percent, left + cell - 14, y + 55, { size: 14, weight: 600, color: "#3979a5", align: "right" });
      context.font = `500 11px ${FONT}`;
      wrapText(context, description, cell - 28).slice(0, 2).forEach((line, lineIndex) => put(context, line, left + 14, y + 74 + lineIndex * 15, { size: 11, weight: 500, color: "#6f8094" }));
    });
  }
  window.PMStatusPriorityImage = async function(rows, opts = {}) {
    if (!opts.skipFonts) await loadImageFonts();
    const model = buildModel(rows || []), scaleFactor = 2, width = 1600, margin = 40, gap = 24, panelWidth = (width - margin * 2 - gap) / 2, panelTop = 124, panelHeight = 704, height = panelTop + panelHeight + 64;
    const canvas = opts.createCanvas ? opts.createCanvas(width * scaleFactor, height * scaleFactor) : document.createElement("canvas");
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    const context = canvas.getContext("2d");
    context.scale(scaleFactor, scaleFactor);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#173e68";
    context.fillRect(0, 0, width, 14);
    put(context, "RINGKASAN OPERASIONAL", margin, 58, { size: 12, weight: 600, color: "#77899e", spacing: 1.6 });
    put(context, "STATUS & PRIORITAS PM", margin, 92, { size: 27, weight: 600, color: "#263f5f", spacing: 0.8 });
    put(context, model.period, width - margin, 92, { size: 16, weight: 500, color: "#64748b", align: "right" });
    const panel2 = (x, title) => {
      context.fillStyle = "#fbfcfe";
      context.fillRect(x, panelTop, panelWidth, panelHeight);
      context.strokeStyle = "#d8e1eb";
      context.lineWidth = 1;
      context.strokeRect(x + 0.5, panelTop + 0.5, panelWidth - 1, panelHeight - 1);
      put(context, title, x + 28, panelTop + 46, { size: 16, weight: 600, color: "#53657a", spacing: 1.3 });
      put(context, model.period, x + panelWidth - 28, panelTop + 46, { size: 13, weight: 500, color: "#64748b", align: "right" });
    };
    const leftX = margin;
    panel2(leftX, "STATUS PM");
    const donutX = leftX + 28 + 138, donutY = panelTop + 88 + 138, outer = 116, thick = 32, radius = outer - thick / 2;
    if (model.total) {
      let angle = -Math.PI / 2;
      model.statuses.forEach(([, count], index) => {
        const span = count / model.total * Math.PI * 2, gapAngle = Math.min(0.03, span * 0.3);
        context.beginPath();
        context.arc(donutX, donutY, radius, angle + gapAngle / 2, angle + span - gapAngle / 2);
        context.strokeStyle = STATUS_COLORS[index % STATUS_COLORS.length];
        context.lineWidth = thick;
        context.lineCap = "butt";
        context.stroke();
        angle += span;
      });
    }
    put(context, numberFormat.format(model.total), donutX, donutY + 8, { size: 42, weight: 600, color: "#173e68", align: "center" });
    put(context, "Plan PM", donutX, donutY + 34, { size: 13, weight: 500, color: "#738398", align: "center" });
    const tableX = leftX + 28 + 276 + 28, tableRight = leftX + panelWidth - 28, rowH = 31;
    let rowY = panelTop + 98;
    put(context, "STATUS", tableX, rowY, { size: 10.5, weight: 600, color: "#7b8a9c", spacing: 1 });
    put(context, "JUMLAH", tableRight - 70, rowY, { size: 10.5, weight: 600, color: "#7b8a9c", align: "right", spacing: 1 });
    put(context, "%", tableRight, rowY, { size: 10.5, weight: 600, color: "#7b8a9c", align: "right", spacing: 1 });
    model.statuses.slice(0, 9).forEach(([label, count], index) => {
      const y = rowY + 10 + index * rowH;
      context.fillStyle = "#e0e7ef";
      context.fillRect(tableX, y, tableRight - tableX, 1);
      context.fillStyle = STATUS_COLORS[index % STATUS_COLORS.length];
      context.fillRect(tableX, y + 11, 12, 12);
      put(context, titleCase(label), tableX + 22, y + 21, { size: 13, weight: 500, color: "#607086" });
      put(context, numberFormat.format(count), tableRight - 70, y + 21, { size: 13.5, weight: 600, color: "#173e68", align: "right" });
      put(context, percentOf(count, model.total), tableRight, y + 21, { size: 13, weight: 500, color: "#8090a2", align: "right" });
    });
    const insightY = panelTop + 460;
    context.fillStyle = "#dfe6ee";
    context.fillRect(leftX + 28, insightY, panelWidth - 56, 1);
    put(context, "RINGKASAN", leftX + 28, insightY + 28, { size: 10.5, weight: 600, color: "#7a8a9d", spacing: 1.4 });
    drawChips(context, model.statusChips, leftX + 28, insightY + 42, panelWidth - 56, 96);
    context.font = `500 12px ${FONT}`;
    put(context, `Persentase dihitung dari ${numberFormat.format(model.total)} Plan PM pada ${model.period}.`, leftX + 28, insightY + 168, { size: 12, weight: 500, color: "#64748b" });
    const rightX = margin + panelWidth + gap;
    panel2(rightX, "TOP NOP KENDALA");
    if (model.top.length) {
      const scale = 1.12, cx = rightX + panelWidth / 2, cy = panelTop + 250, unit = scale;
      const pt = (index, value2) => {
        const [x, y] = radarPoint(model, index, value2);
        return [cx + (x - RADAR.cx) * unit, cy + (y - RADAR.cy) * unit];
      };
      const polygon = (valueOf, fill, stroke, line, dash) => {
        context.beginPath();
        model.top.forEach((item, index) => {
          const [x, y] = pt(index, valueOf(item));
          index ? context.lineTo(x, y) : context.moveTo(x, y);
        });
        context.closePath();
        if (fill) {
          context.fillStyle = fill;
          context.fill();
        }
        context.setLineDash(dash || []);
        context.strokeStyle = stroke;
        context.lineWidth = line;
        context.lineJoin = "round";
        context.stroke();
        context.setLineDash([]);
      };
      [1, 2, 3, 4].forEach((step) => polygon(() => model.scale.step * step, null, "#d8e2ec", 1));
      model.top.forEach((item, index) => {
        const [x, y] = pt(index, model.scale.max);
        context.beginPath();
        context.moveTo(cx, cy);
        context.lineTo(x, y);
        context.strokeStyle = "#d8e2ec";
        context.lineWidth = 1;
        context.stroke();
      });
      [1, 2, 3, 4].forEach((step) => {
        const [x, y] = pt(0.5, model.scale.step * step);
        put(context, String(model.scale.step * step), x, y + 4, { size: 10.5, weight: 500, color: "#8a99ab", align: "center", halo: "#fbfcfe" });
      });
      polygon(() => model.average, null, "#8290a3", 1.6, [6, 5]);
      polygon((item) => item.value, "rgba(57,121,165,.18)", "#3979a5", 3);
      model.top.forEach((item, index) => {
        const [x, y] = pt(index, item.value);
        context.beginPath();
        context.arc(x, y, 6, 0, Math.PI * 2);
        context.fillStyle = "#ffffff";
        context.fill();
        context.strokeStyle = "#3979a5";
        context.lineWidth = 3;
        context.stroke();
      });
      const mapX = (x) => cx + (x - RADAR.cx) * unit, mapY = (y) => cy + (y - RADAR.cy) * unit;
      model.top.forEach((item, index) => {
        const label = radarLabel(model, index), align = label.anchor === "start" ? "left" : label.anchor === "end" ? "right" : "center";
        label.lines.forEach((line, lineIndex) => put(context, line.toUpperCase(), mapX(label.x), mapY(label.nameY + lineIndex * 13), { size: 12.5, weight: 600, color: "#596b80", align, spacing: 0.4 }));
        put(context, String(item.value), mapX(label.x), mapY(label.numberY), { size: 18, weight: 600, color: "#173e68", align });
      });
    } else put(context, "Tidak ada kendala pada periode ini.", rightX + panelWidth / 2, panelTop + 260, { size: 15, weight: 500, color: "#64748b", align: "center" });
    const keyY = panelTop + 470;
    context.fillStyle = "#3979a5";
    context.fillRect(rightX + panelWidth / 2 - 170, keyY - 10, 12, 12);
    put(context, "Jumlah kendala per NOP", rightX + panelWidth / 2 - 150, keyY, { size: 12, weight: 500, color: "#6f8094" });
    context.setLineDash([5, 4]);
    context.beginPath();
    context.moveTo(rightX + panelWidth / 2 + 34, keyY - 4);
    context.lineTo(rightX + panelWidth / 2 + 56, keyY - 4);
    context.strokeStyle = "#8290a3";
    context.lineWidth = 2;
    context.stroke();
    context.setLineDash([]);
    put(context, `Rata-rata ${model.averageLabel}`, rightX + panelWidth / 2 + 64, keyY, { size: 12, weight: 500, color: "#6f8094" });
    const noteY = panelTop + 500;
    context.fillStyle = "#dfe6ee";
    context.fillRect(rightX + 28, noteY + 14, panelWidth - 56, 1);
    put(context, "RINGKASAN", rightX + 28, noteY + 42, { size: 10.5, weight: 600, color: "#7a8a9d", spacing: 1.4 });
    drawChips(context, model.nopChips, rightX + 28, noteY + 56, panelWidth - 56, 96);
    put(context, model.definition, rightX + 28, noteY + 182, { size: 12, weight: 500, color: "#64748b" });
    const stamp = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(/* @__PURE__ */ new Date());
    put(context, `A1 Operations Command Center \xB7 dibuat ${stamp} WIB`, margin, height - 26, { size: 12, weight: 500, color: "#64748b" });
    return canvas;
  };
  function saveBlob(canvas, filename) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, "image/png");
  }
  window.PMAttentionCharts = function({ rows = [], loading }) {
    const model = buildModel(rows), total = model.total, circumference = 2 * Math.PI * 80;
    let offset = 0;
    const download = async () => {
      try {
        saveBlob(await window.PMStatusPriorityImage(rows), `status-prioritas-pm-${model.periodKey || "periode-aktif"}.png`);
      } catch (error) {
        window.alert("Gambar belum dapat dibuat: " + error.message);
      }
    };
    const donut = /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-donut" }, /* @__PURE__ */ R.createElement("svg", { viewBox: "0 0 220 220", role: "img", "aria-label": `Status PM, ${total} plan` }, /* @__PURE__ */ R.createElement("g", { transform: "rotate(-90 110 110)" }, model.statuses.map(([label, count], index) => {
      const length = count / Math.max(total, 1) * circumference, gap = 2.2, segment = /* @__PURE__ */ R.createElement("circle", { key: label, cx: "110", cy: "110", r: "80", fill: "none", stroke: STATUS_COLORS[index % STATUS_COLORS.length], strokeWidth: "25", strokeDasharray: `${Math.max(length - gap, 0.8)} ${circumference}`, strokeDashoffset: -offset }, /* @__PURE__ */ R.createElement("title", null, `${titleCase(label)}: ${numberFormat.format(count)} (${percentOf(count, total)})`));
      offset += length;
      return segment;
    }))), /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("strong", null, numberFormat.format(total)), /* @__PURE__ */ R.createElement("span", null, "Plan PM")));
    const polygon = (value2) => model.top.map((item, index) => radarPoint(model, index, value2).slice(0, 2).map((number2) => number2.toFixed(1)).join(",")).join(" ");
    const radar = /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-radar" }, /* @__PURE__ */ R.createElement("svg", { viewBox: "0 0 520 400", role: "img", "aria-label": "Radar jumlah kendala per NOP" }, [1, 2, 3, 4].map((step) => /* @__PURE__ */ R.createElement("polygon", { key: step, className: "pm-snippet-radar-ring", points: polygon(model.scale.step * step) })), model.top.map((item, index) => {
      const [x, y] = radarPoint(model, index, model.scale.max);
      return /* @__PURE__ */ R.createElement("line", { key: item.name, className: "pm-snippet-radar-axis", x1: RADAR.cx, y1: RADAR.cy, x2: x, y2: y });
    }), [1, 2, 3, 4].map((step) => {
      const [x, y] = radarPoint(model, 0.5, model.scale.step * step);
      return /* @__PURE__ */ R.createElement("text", { key: step, className: "pm-snippet-radar-scale", x, y: y + 3, textAnchor: "middle" }, model.scale.step * step);
    }), /* @__PURE__ */ R.createElement("polygon", { className: "pm-snippet-radar-average", points: polygon(model.average) }), /* @__PURE__ */ R.createElement("polygon", { className: "pm-snippet-radar-area", points: model.top.map((item, index) => radarPoint(model, index, item.value).slice(0, 2).join(",")).join(" ") }), model.top.map((item, index) => {
      const [x, y] = radarPoint(model, index, item.value), label = radarLabel(model, index);
      return /* @__PURE__ */ R.createElement("g", { key: item.name }, /* @__PURE__ */ R.createElement("circle", { className: "pm-snippet-radar-point", cx: x, cy: y, r: "5" }, /* @__PURE__ */ R.createElement("title", null, `${item.name}: ${item.value} kendala`)), /* @__PURE__ */ R.createElement("text", { className: "pm-snippet-radar-name", x: label.x, y: label.nameY, textAnchor: label.anchor }, label.lines.map((line, lineIndex) => /* @__PURE__ */ R.createElement("tspan", { key: lineIndex, x: label.x, dy: lineIndex ? 13 : 0 }, line.toUpperCase()))), /* @__PURE__ */ R.createElement("text", { className: "pm-snippet-radar-number", x: label.x, y: label.numberY, textAnchor: label.anchor }, item.value));
    })));
    const chip = ([label, value2, percent, description]) => /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-chip", key: label }, /* @__PURE__ */ R.createElement("span", null, label), /* @__PURE__ */ R.createElement("strong", null, value2, percent ? /* @__PURE__ */ R.createElement("em", null, percent) : null), /* @__PURE__ */ R.createElement("small", null, description));
    const statusTable = /* @__PURE__ */ R.createElement("table", null, /* @__PURE__ */ R.createElement("thead", null, /* @__PURE__ */ R.createElement("tr", null, /* @__PURE__ */ R.createElement("th", null, "Status"), /* @__PURE__ */ R.createElement("th", null, "Jumlah"), /* @__PURE__ */ R.createElement("th", null, "%"))), /* @__PURE__ */ R.createElement("tbody", null, model.statuses.map(([label, count], index) => /* @__PURE__ */ R.createElement("tr", { key: label }, /* @__PURE__ */ R.createElement("td", null, /* @__PURE__ */ R.createElement("i", { style: { background: STATUS_COLORS[index % STATUS_COLORS.length] } }), titleCase(label)), /* @__PURE__ */ R.createElement("td", null, numberFormat.format(count)), /* @__PURE__ */ R.createElement("td", null, percentOf(count, total))))));
    return /* @__PURE__ */ R.createElement("section", { className: "pm-snippet-visuals", "aria-busy": loading ? "true" : "false" }, /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-head" }, /* @__PURE__ */ R.createElement("div", null, /* @__PURE__ */ R.createElement("p", null, "RINGKASAN OPERASIONAL"), /* @__PURE__ */ R.createElement("h3", null, "STATUS & PRIORITAS PM")), /* @__PURE__ */ R.createElement("button", { type: "button", className: "pm-export-button pm-export-image", onClick: download }, "\u2193 Download Image")), loading ? /* @__PURE__ */ R.createElement("p", { className: "pm-attention-note" }, "Memuat grafik\u2026") : /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-row" }, /* @__PURE__ */ R.createElement("section", { className: "pm-snippet-panel" }, /* @__PURE__ */ R.createElement("header", null, /* @__PURE__ */ R.createElement("h4", null, "STATUS PM"), /* @__PURE__ */ R.createElement("span", null, model.period)), total ? /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-status" }, donut, statusTable) : /* @__PURE__ */ R.createElement("p", { className: "pm-chart-empty" }, "Tidak ada data status PM pada filter ini."), /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-insight" }, /* @__PURE__ */ R.createElement("p", null, "RINGKASAN"), /* @__PURE__ */ R.createElement("div", null, model.statusChips.map(chip)), /* @__PURE__ */ R.createElement("small", { className: "pm-snippet-note" }, `Persentase dihitung dari ${numberFormat.format(total)} Plan PM pada ${model.period}.`))), /* @__PURE__ */ R.createElement("section", { className: "pm-snippet-panel" }, /* @__PURE__ */ R.createElement("header", null, /* @__PURE__ */ R.createElement("h4", null, "TOP NOP KENDALA"), /* @__PURE__ */ R.createElement("span", null, model.period)), model.top.length ? radar : /* @__PURE__ */ R.createElement("p", { className: "pm-chart-empty" }, "Tidak ada kendala pada periode ini."), /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-radar-key" }, /* @__PURE__ */ R.createElement("i", null), " Jumlah kendala per NOP ", /* @__PURE__ */ R.createElement("b", null), " Rata-rata ", model.averageLabel), /* @__PURE__ */ R.createElement("div", { className: "pm-snippet-insight" }, /* @__PURE__ */ R.createElement("p", null, "RINGKASAN"), /* @__PURE__ */ R.createElement("div", { className: "is-three" }, model.nopChips.map(chip)), /* @__PURE__ */ R.createElement("small", { className: "pm-snippet-note" }, model.definition)))));
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
      return /* @__PURE__ */ R.createElement("div", { className: "genset-detail space-y-4" }, /* @__PURE__ */ R.createElement("header", { className: "genset-header" }, /* @__PURE__ */ R.createElement("div", { className: "genset-identity" }, /* @__PURE__ */ R.createElement("button", { className: "pm-site-back", onClick: back }, "\u2190 Kembali ke PM Genset"), /* @__PURE__ */ R.createElement("p", { className: "pm-site-eyebrow" }, pm.site_id), /* @__PURE__ */ R.createElement("h2", null, value(m.site_name || pm.site_name)), /* @__PURE__ */ R.createElement("p", { className: "genset-note" }, value(pm.ticket_no)), /* @__PURE__ */ R.createElement("div", { className: "genset-header-tags" }, tag("PM Genset", "navy"), tag(m.genset_capacity > 0 ? `${number(m.genset_capacity)} kVA` : unavailable, "gray"), tag(pm.status), tag(((_a = detail.evaluation) == null ? void 0 : _a.evaluation_status) || "Belum dievaluasi"), tag(/backup/i.test(pm.type_power) ? "Backup Power" : /main/i.test(pm.type_power) ? "Main Power" : value(pm.type_power), "navy")), /* @__PURE__ */ R.createElement("p", { className: "genset-region" }, value(m.nop || pm.nop), " \xB7 ", value(m.regional || pm.regional).replace(/_/g, " "))), /* @__PURE__ */ R.createElement(Map, { master })), /* @__PURE__ */ R.createElement("div", { className: "genset-window" }, detail.anchor ? [/* @__PURE__ */ R.createElement("span", { key: "anchor" }, "Acuan: ", timestamp(detail.anchor), " \xB7 ", detail.anchor_label), /* @__PURE__ */ R.createElement("label", { key: "window" }, "Jendela perbandingan ", /* @__PURE__ */ R.createElement("select", { className: "control", "aria-label": "Jendela perbandingan genset", value: detail.rules.windowDays, onChange: (e) => onWindow(Number(e.target.value)) }, [.../* @__PURE__ */ new Set([detail.rules.windowDays, 7, 14, 30])].sort((a, b) => a - b).map((v) => /* @__PURE__ */ R.createElement("option", { key: v, value: v }, v, " hari"))))] : /* @__PURE__ */ R.createElement("span", null, "Fokus evaluasi: kesiapan pekerjaan dan aset kelistrikan genset")), /* @__PURE__ */ R.createElement("div", { className: "pm-site-tabs", role: "tablist", "aria-label": "Detail PM Genset" }, labels.map((label, i) => /* @__PURE__ */ R.createElement("button", { id: "genset-tab-" + i, key: label, role: "tab", "aria-selected": tab === i, "aria-controls": "genset-panel-" + i, tabIndex: tab === i ? 0 : -1, onClick: () => this.setState({ tab: i }), onKeyDown: (e) => keyDown(e, i) }, label))), /* @__PURE__ */ R.createElement("div", { role: "tabpanel", id: "genset-panel-" + tab, "aria-labelledby": "genset-tab-" + tab }, tab === 0 ? /* @__PURE__ */ R.createElement(Analysis, { detail, SummaryCard }) : tab === 1 ? /* @__PURE__ */ R.createElement(Information, { detail }) : tab === 2 ? /* @__PURE__ */ R.createElement(History, { detail }) : /* @__PURE__ */ R.createElement(Evaluation, { detail, onSaved })));
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
  const PMAttentionChartsBase = window.PMAttentionCharts;
  window.PMAttentionCharts = function(props) {
    const chart = /* @__PURE__ */ R.createElement(PMAttentionChartsBase, { ...props });
    return (props == null ? void 0 : props.kind) === "site" && window.PMPunchlistCoverage ? /* @__PURE__ */ R.createElement(R.Fragment, null, chart, /* @__PURE__ */ R.createElement(window.PMPunchlistCoverage, { rows: props.rows })) : chart;
  };
  window.PMGensetWorkspace = Workspace;
})();
