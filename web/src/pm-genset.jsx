(function () {
  const R=window.React;
  // Proyek masih memakai React 16.0 yang belum menyediakan Fragment.
  // Fallback elemen native menjaga grafik radar tetap dapat dirender.
  R.Fragment = R.Fragment || 'div';
  const workStatusTone = status => /REJECT|CANCEL|TAKE.?OUT/.test(String(status).toUpperCase())?'red':/CLOSED|COMPLETED/.test(String(status).toUpperCase())?'green':/SUBMIT|APPROVAL/.test(String(status).toUpperCase())?'purple':/PROGRESS/.test(String(status).toUpperCase())?'orange':/ASSIGNED/.test(String(status).toUpperCase())?'navy':'gray';
  window.PMWorkStatus = function({status}) { return <span className={'pm-work-status is-'+workStatusTone(status)}>{status}</span>; };
  window.PMConditionBadge = function({row}) {return <span className={'pm-condition-badge is-'+(row.condition_tone||'gray')} title="Kondisi berdasarkan sumber dan jendela evaluasi tersedia">{row.condition_label||'Belum dapat dievaluasi'}</span>;};
  // ---------------------------------------------------------------------------
  // Status & Prioritas PM (Dashboard dan PM Site).
  // Satu model data dipakai oleh tampilan layar DAN gambar unduhan, jadi angka,
  // urutan, dan teks keduanya selalu sama. React proyek masih 16.0 (tanpa Fragment).
  // ---------------------------------------------------------------------------
  const STATUS_COLORS=['#173e68','#c47b2b','#7255b3','#4c9899','#c75358','#8b99aa','#4b8d68','#6686bb','#a85f8e'];
  const numberFormat=new Intl.NumberFormat('id-ID');
  const titleCase=value=>String(value||'Status belum tersedia').toLowerCase().replace(/\b\w/g,char=>char.toUpperCase());
  const percentOf=(part,whole)=>(part/Math.max(whole,1)*100).toFixed(1).replace('.',',')+'%';
  // Nama NOP panjang dipecah menjadi dua baris, bukan dipotong dengan "…".
  const splitLabel=(text,limit=13)=>{
    const value=String(text),words=value.split(' ');
    if(value.length<=limit||words.length<2)return [value];
    let best=1,gap=Infinity;
    for(let index=1;index<words.length;index++){const left=words.slice(0,index).join(' ').length,right=words.slice(index).join(' ').length;if(Math.abs(left-right)<gap){gap=Math.abs(left-right);best=index;}}
    return [words.slice(0,best).join(' '),words.slice(best).join(' ')];
  };
  // Skala radar dibulatkan ke angka rapi (kelipatan 5/10/20/25/50/100) agar label cincin mudah dibaca.
  const niceScale=peak=>{const step=[5,10,20,25,50,100,200,500,1000].find(item=>item*4>=peak)||Math.ceil(peak/4);return {step,max:step*4};};
  const RADAR={cx:260,cy:200,radius:120,labelRatio:1.16};
  function buildModel(rows){
    const groups={};rows.forEach(row=>{const label=row.status||'Status belum tersedia';groups[label]=(groups[label]||0)+1;});
    const statuses=Object.entries(groups).sort((a,b)=>b[1]-a[1]),total=rows.length;
    const source=rows.find(row=>row.schedule_date||row.submitted_date)||{},periodKey=String(source.schedule_date||source.submitted_date||'').slice(0,7);
    const period=periodKey?new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(periodKey+'-01T00:00:00Z')):'Periode aktif';
    const sumOf=pattern=>statuses.filter(([label])=>pattern.test(label)).reduce((sum,[,value])=>sum+value,0);
    const completed=sumOf(/closed|completed/i),active=sumOf(/submitted|progress|assigned|new/i),waiting=sumOf(/waiting|approval/i),exception=sumOf(/take out|rejected/i);
    const statusChips=[
      ['Selesai',completed,percentOf(completed,total),'Closed dan Completed'],
      ['Masih berjalan',active,percentOf(active,total),'Submitted, Progress, Assigned, New'],
      ['Menunggu approval',waiting,percentOf(waiting,total),'Waiting Approval'],
      ['Take Out dan Rejected',exception,percentOf(exception,total),'Perlu tindak lanjut']
    ];
    // Kendala = Rejected, atau lewat jadwal tetapi belum submit / approval / closed.
    const normalized=row=>String(row.status||'').toUpperCase().replace(/[ _-]/g,'');
    const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'),nop={};
    rows.forEach(row=>{const state=normalized(row),rejected=state==='REJECTED',late=!row.submitted_date&&!/SUBMIT|APPROVAL|CLOSED|COMPLETED/.test(state)&&row.schedule_date&&row.schedule_date<today;if(!rejected&&!late)return;const name=String(row.nop||'NOP belum tersedia').replace(/^NOP\s+/i,'').replace(/_/g,' ');const item=nop[name]||(nop[name]={name,value:0});item.value++;});
    const everyNop=Object.values(nop).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)),top=everyNop.slice(0,8);
    const totalIssues=everyNop.reduce((sum,item)=>sum+item.value,0),average=top.length?top.reduce((sum,item)=>sum+item.value,0)/top.length:0;
    const scale=niceScale(Math.max(1,...top.map(item=>item.value)));
    const lowest=top.length?top[top.length-1]:null;
    const nopChips=[
      ['Total kendala',numberFormat.format(totalIssues),'',`pada ${everyNop.length} NOP`],
      ['Tertinggi',top.length?top[0].value:0,'',top.length?top[0].name:'-'],
      ['Terendah',lowest?lowest.value:0,'',lowest?`${lowest.name}, dari ${top.length} teratas`:'-']
    ];
    return {statuses,total,period,periodKey,statusChips,top,everyNop,totalIssues,average,scale,nopChips,
      averageLabel:average.toFixed(1).replace('.',','),
      definition:'Kendala = PM berstatus Rejected, atau sudah lewat jadwal tetapi belum submit.'};
  }
  const radarPoint=(model,index,value)=>{const angle=-Math.PI/2+index*Math.PI*2/Math.max(model.top.length,3),radius=RADAR.radius*value/model.scale.max;return [RADAR.cx+Math.cos(angle)*radius,RADAR.cy+Math.sin(angle)*radius,angle];};
  // Posisi label radar: blok nama (1-2 baris) + angka, menempel di luar ujung sumbu.
  function radarLabel(model,index){
    const [lx,ly,angle]=radarPoint(model,index,model.scale.max*RADAR.labelRatio),lines=splitLabel(model.top[index].name),sine=Math.sin(angle),cosine=Math.cos(angle);
    const anchor=cosine>0.3?'start':cosine<-0.3?'end':'middle',height=lines.length*13+18;
    const top=sine<-0.5?ly-height:sine>0.5?ly:ly-height/2;
    return {x:lx,anchor,lines,top,numberY:top+lines.length*13+15,nameY:top+10};
  }

  // ---- Gambar unduhan (canvas): meniru tampilan layar dengan font Poppins ----
  async function loadImageFonts(){try{if(document.fonts&&document.fonts.load)await Promise.all(['400','500','600'].map(weight=>document.fonts.load(`${weight} 16px Poppins`)));}catch(error){/* font bawaan dipakai bila Poppins gagal dimuat */}}
  const FONT="Poppins, 'Segoe UI', Arial, sans-serif";
  function put(context,text,x,y,{size=14,weight=500,color='#243a55',align='left',spacing=0,halo=''}={}){
    context.font=`${weight} ${size}px ${FONT}`;context.fillStyle=color;context.textAlign=align;context.textBaseline='alphabetic';
    if('letterSpacing' in context)context.letterSpacing=spacing?`${spacing}px`:'0px';
    if(halo){context.lineWidth=4;context.lineJoin='round';context.strokeStyle=halo;context.strokeText(text,x,y);}
    context.fillText(text,x,y);if('letterSpacing' in context)context.letterSpacing='0px';
  }
  function wrapText(context,text,maxWidth){
    const words=String(text).split(' '),lines=[];let line='';
    words.forEach(word=>{const next=line?line+' '+word:word;if(context.measureText(next).width>maxWidth&&line){lines.push(line);line=word;}else line=next;});
    if(line)lines.push(line);return lines;
  }
  function drawChips(context,chips,x,y,width,height,gap=12){
    const cell=(width-gap*(chips.length-1))/chips.length;
    chips.forEach(([label,value,percent,description],index)=>{
      const left=x+index*(cell+gap);context.fillStyle='#f1f5f9';context.fillRect(left,y,cell,height);
      put(context,label.toUpperCase(),left+14,y+22,{size:10.5,weight:600,color:'#6d7d90',spacing:.5});
      put(context,String(value),left+14,y+55,{size:28,weight:600,color:'#173e68'});
      if(percent)put(context,percent,left+cell-14,y+55,{size:14,weight:600,color:'#3979a5',align:'right'});
      context.font=`500 11px ${FONT}`;wrapText(context,description,cell-28).slice(0,2).forEach((line,lineIndex)=>put(context,line,left+14,y+74+lineIndex*15,{size:11,weight:500,color:'#6f8094'}));
    });
  }
  // rows = baris PM Dashboard/PM Site. opts.createCanvas dipakai untuk pengujian di luar browser.
  window.PMStatusPriorityImage=async function(rows,opts={}){
    if(!opts.skipFonts)await loadImageFonts();
    const model=buildModel(rows||[]),scaleFactor=2,width=1600,margin=40,gap=24,panelWidth=(width-margin*2-gap)/2,panelTop=124,panelHeight=704,height=panelTop+panelHeight+64;
    const canvas=opts.createCanvas?opts.createCanvas(width*scaleFactor,height*scaleFactor):document.createElement('canvas');
    canvas.width=width*scaleFactor;canvas.height=height*scaleFactor;
    const context=canvas.getContext('2d');context.scale(scaleFactor,scaleFactor);
    context.fillStyle='#ffffff';context.fillRect(0,0,width,height);context.fillStyle='#173e68';context.fillRect(0,0,width,14);
    put(context,'RINGKASAN OPERASIONAL',margin,58,{size:12,weight:600,color:'#77899e',spacing:1.6});
    put(context,'STATUS & PRIORITAS PM',margin,92,{size:27,weight:600,color:'#263f5f',spacing:.8});
    put(context,model.period,width-margin,92,{size:16,weight:500,color:'#64748b',align:'right'});
    const panel=(x,title)=>{
      context.fillStyle='#fbfcfe';context.fillRect(x,panelTop,panelWidth,panelHeight);context.strokeStyle='#d8e1eb';context.lineWidth=1;context.strokeRect(x+.5,panelTop+.5,panelWidth-1,panelHeight-1);
      put(context,title,x+28,panelTop+46,{size:16,weight:600,color:'#53657a',spacing:1.3});
      put(context,model.period,x+panelWidth-28,panelTop+46,{size:13,weight:500,color:'#64748b',align:'right'});
    };
    // --- Panel kiri: donut, tabel status, ringkasan ---
    const leftX=margin;panel(leftX,'STATUS PM');
    const donutX=leftX+28+138,donutY=panelTop+88+138,outer=116,thick=32,radius=outer-thick/2;
    if(model.total){
      let angle=-Math.PI/2;
      model.statuses.forEach(([,count],index)=>{
        const span=count/model.total*Math.PI*2,gapAngle=Math.min(0.03,span*0.3);
        context.beginPath();context.arc(donutX,donutY,radius,angle+gapAngle/2,angle+span-gapAngle/2);
        context.strokeStyle=STATUS_COLORS[index%STATUS_COLORS.length];context.lineWidth=thick;context.lineCap='butt';context.stroke();angle+=span;
      });
    }
    put(context,numberFormat.format(model.total),donutX,donutY+8,{size:42,weight:600,color:'#173e68',align:'center'});
    put(context,'Plan PM',donutX,donutY+34,{size:13,weight:500,color:'#738398',align:'center'});
    const tableX=leftX+28+276+28,tableRight=leftX+panelWidth-28,rowH=31;let rowY=panelTop+98;
    put(context,'STATUS',tableX,rowY,{size:10.5,weight:600,color:'#7b8a9c',spacing:1});
    put(context,'JUMLAH',tableRight-70,rowY,{size:10.5,weight:600,color:'#7b8a9c',align:'right',spacing:1});
    put(context,'%',tableRight,rowY,{size:10.5,weight:600,color:'#7b8a9c',align:'right',spacing:1});
    model.statuses.slice(0,9).forEach(([label,count],index)=>{
      const y=rowY+10+index*rowH;context.fillStyle='#e0e7ef';context.fillRect(tableX,y,tableRight-tableX,1);
      context.fillStyle=STATUS_COLORS[index%STATUS_COLORS.length];context.fillRect(tableX,y+11,12,12);
      put(context,titleCase(label),tableX+22,y+21,{size:13,weight:500,color:'#607086'});
      put(context,numberFormat.format(count),tableRight-70,y+21,{size:13.5,weight:600,color:'#173e68',align:'right'});
      put(context,percentOf(count,model.total),tableRight,y+21,{size:13,weight:500,color:'#8090a2',align:'right'});
    });
    const insightY=panelTop+460;
    context.fillStyle='#dfe6ee';context.fillRect(leftX+28,insightY,panelWidth-56,1);
    put(context,'RINGKASAN',leftX+28,insightY+28,{size:10.5,weight:600,color:'#7a8a9d',spacing:1.4});
    drawChips(context,model.statusChips,leftX+28,insightY+42,panelWidth-56,96);
    context.font=`500 12px ${FONT}`;
    put(context,`Persentase dihitung dari ${numberFormat.format(model.total)} Plan PM pada ${model.period}.`,leftX+28,insightY+168,{size:12,weight:500,color:'#64748b'});
    // --- Panel kanan: radar, kunci, ringkasan ---
    const rightX=margin+panelWidth+gap;panel(rightX,'TOP NOP KENDALA');
    if(model.top.length){
      const scale=1.12,cx=rightX+panelWidth/2,cy=panelTop+250,unit=scale;
      const pt=(index,value)=>{const [x,y]=radarPoint(model,index,value);return [cx+(x-RADAR.cx)*unit,cy+(y-RADAR.cy)*unit];};
      const polygon=(valueOf,fill,stroke,line,dash)=>{
        context.beginPath();model.top.forEach((item,index)=>{const [x,y]=pt(index,valueOf(item));index?context.lineTo(x,y):context.moveTo(x,y);});context.closePath();
        if(fill){context.fillStyle=fill;context.fill();}context.setLineDash(dash||[]);context.strokeStyle=stroke;context.lineWidth=line;context.lineJoin='round';context.stroke();context.setLineDash([]);
      };
      [1,2,3,4].forEach(step=>polygon(()=>model.scale.step*step,null,'#d8e2ec',1));
      model.top.forEach((item,index)=>{const [x,y]=pt(index,model.scale.max);context.beginPath();context.moveTo(cx,cy);context.lineTo(x,y);context.strokeStyle='#d8e2ec';context.lineWidth=1;context.stroke();});
      [1,2,3,4].forEach(step=>{const [x,y]=pt(0.5,model.scale.step*step);put(context,String(model.scale.step*step),x,y+4,{size:10.5,weight:500,color:'#8a99ab',align:'center',halo:'#fbfcfe'});});
      polygon(()=>model.average,null,'#8290a3',1.6,[6,5]);
      polygon(item=>item.value,'rgba(57,121,165,.18)','#3979a5',3);
      model.top.forEach((item,index)=>{const [x,y]=pt(index,item.value);context.beginPath();context.arc(x,y,6,0,Math.PI*2);context.fillStyle='#ffffff';context.fill();context.strokeStyle='#3979a5';context.lineWidth=3;context.stroke();});
      // Label dihitung di koordinat SVG (pusat 260,200); dipetakan ke pusat radar di canvas.
      const mapX=x=>cx+(x-RADAR.cx)*unit,mapY=y=>cy+(y-RADAR.cy)*unit;
      model.top.forEach((item,index)=>{
        const label=radarLabel(model,index),align=label.anchor==='start'?'left':label.anchor==='end'?'right':'center';
        label.lines.forEach((line,lineIndex)=>put(context,line.toUpperCase(),mapX(label.x),mapY(label.nameY+lineIndex*13),{size:12.5,weight:600,color:'#596b80',align,spacing:.4}));
        put(context,String(item.value),mapX(label.x),mapY(label.numberY),{size:18,weight:600,color:'#173e68',align});
      });
    }else put(context,'Tidak ada kendala pada periode ini.',rightX+panelWidth/2,panelTop+260,{size:15,weight:500,color:'#64748b',align:'center'});
    const keyY=panelTop+470;
    context.fillStyle='#3979a5';context.fillRect(rightX+panelWidth/2-170,keyY-10,12,12);
    put(context,'Jumlah kendala per NOP',rightX+panelWidth/2-150,keyY,{size:12,weight:500,color:'#6f8094'});
    context.setLineDash([5,4]);context.beginPath();context.moveTo(rightX+panelWidth/2+34,keyY-4);context.lineTo(rightX+panelWidth/2+56,keyY-4);context.strokeStyle='#8290a3';context.lineWidth=2;context.stroke();context.setLineDash([]);
    put(context,`Rata-rata ${model.averageLabel}`,rightX+panelWidth/2+64,keyY,{size:12,weight:500,color:'#6f8094'});
    const noteY=panelTop+500;
    context.fillStyle='#dfe6ee';context.fillRect(rightX+28,noteY+14,panelWidth-56,1);
    put(context,'RINGKASAN',rightX+28,noteY+42,{size:10.5,weight:600,color:'#7a8a9d',spacing:1.4});
    drawChips(context,model.nopChips,rightX+28,noteY+56,panelWidth-56,96);
    put(context,model.definition,rightX+28,noteY+182,{size:12,weight:500,color:'#64748b'});
    // --- Footer ---
    const stamp=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date());
    put(context,`Automated Operations System · dibuat ${stamp} WIB`,margin,height-26,{size:12,weight:500,color:'#64748b'});
    return canvas;
  };
  function saveBlob(canvas,filename){canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);},'image/png');}

  // ---- Tampilan layar ----
  window.PMAttentionCharts = function({rows=[],loading}) {
    const model=buildModel(rows),total=model.total,circumference=2*Math.PI*80;let offset=0;
    const download=async()=>{try{saveBlob(await window.PMStatusPriorityImage(rows),`status-prioritas-pm-${model.periodKey||'periode-aktif'}.png`);}catch(error){window.alert('Gambar belum dapat dibuat: '+error.message);}};
    const donut=<div className="pm-snippet-donut"><svg viewBox="0 0 220 220" role="img" aria-label={`Status PM, ${total} plan`}><g transform="rotate(-90 110 110)">{model.statuses.map(([label,count],index)=>{const length=count/Math.max(total,1)*circumference,gap=2.2,segment=<circle key={label} cx="110" cy="110" r="80" fill="none" stroke={STATUS_COLORS[index%STATUS_COLORS.length]} strokeWidth="25" strokeDasharray={`${Math.max(length-gap,.8)} ${circumference}`} strokeDashoffset={-offset}><title>{`${titleCase(label)}: ${numberFormat.format(count)} (${percentOf(count,total)})`}</title></circle>;offset+=length;return segment;})}</g></svg><div><strong>{numberFormat.format(total)}</strong><span>Plan PM</span></div></div>;
    const polygon=value=>model.top.map((item,index)=>radarPoint(model,index,value).slice(0,2).map(number=>number.toFixed(1)).join(',')).join(' ');
    const radar=<div className="pm-snippet-radar"><svg viewBox="0 0 520 400" role="img" aria-label="Radar jumlah kendala per NOP">{[1,2,3,4].map(step=><polygon key={step} className="pm-snippet-radar-ring" points={polygon(model.scale.step*step)}/>)}{model.top.map((item,index)=>{const [x,y]=radarPoint(model,index,model.scale.max);return <line key={item.name} className="pm-snippet-radar-axis" x1={RADAR.cx} y1={RADAR.cy} x2={x} y2={y}/>;})}{[1,2,3,4].map(step=>{const [x,y]=radarPoint(model,0.5,model.scale.step*step);return <text key={step} className="pm-snippet-radar-scale" x={x} y={y+3} textAnchor="middle">{model.scale.step*step}</text>;})}<polygon className="pm-snippet-radar-average" points={polygon(model.average)}/><polygon className="pm-snippet-radar-area" points={model.top.map((item,index)=>radarPoint(model,index,item.value).slice(0,2).join(',')).join(' ')}/>{model.top.map((item,index)=>{const [x,y]=radarPoint(model,index,item.value),label=radarLabel(model,index);return <g key={item.name}><circle className="pm-snippet-radar-point" cx={x} cy={y} r="5"><title>{`${item.name}: ${item.value} kendala`}</title></circle><text className="pm-snippet-radar-name" x={label.x} y={label.nameY} textAnchor={label.anchor}>{label.lines.map((line,lineIndex)=><tspan key={lineIndex} x={label.x} dy={lineIndex?13:0}>{line.toUpperCase()}</tspan>)}</text><text className="pm-snippet-radar-number" x={label.x} y={label.numberY} textAnchor={label.anchor}>{item.value}</text></g>;})}</svg></div>;
    const chip=([label,value,percent,description])=><div className="pm-snippet-chip" key={label}><span>{label}</span><strong>{value}{percent?<em>{percent}</em>:null}</strong><small>{description}</small></div>;
    const statusTable=<table><thead><tr><th>Status</th><th>Jumlah</th><th>%</th></tr></thead><tbody>{model.statuses.map(([label,count],index)=><tr key={label}><td><i style={{background:STATUS_COLORS[index%STATUS_COLORS.length]}}/>{titleCase(label)}</td><td>{numberFormat.format(count)}</td><td>{percentOf(count,total)}</td></tr>)}</tbody></table>;
    return <section className="pm-snippet-visuals" aria-busy={loading?'true':'false'}><div className="pm-snippet-head"><div><p>RINGKASAN OPERASIONAL</p><h3>STATUS & PRIORITAS PM</h3></div><button type="button" className="pm-export-button pm-export-image" onClick={download}>↓ Download Image</button></div>{loading?<p className="pm-attention-note">Memuat grafik…</p>:<div className="pm-snippet-row"><section className="pm-snippet-panel"><header><h4>STATUS PM</h4><span>{model.period}</span></header>{total?<div className="pm-snippet-status">{donut}{statusTable}</div>:<p className="pm-chart-empty">Tidak ada data status PM pada filter ini.</p>}<div className="pm-snippet-insight"><p>RINGKASAN</p><div>{model.statusChips.map(chip)}</div><small className="pm-snippet-note">{`Persentase dihitung dari ${numberFormat.format(total)} Plan PM pada ${model.period}.`}</small></div></section><section className="pm-snippet-panel"><header><h4>TOP NOP KENDALA</h4><span>{model.period}</span></header>{model.top.length?radar:<p className="pm-chart-empty">Tidak ada kendala pada periode ini.</p>}<div className="pm-snippet-radar-key"><i/> Jumlah kendala per NOP <b/> Rata-rata {model.averageLabel}</div><div className="pm-snippet-insight"><p>RINGKASAN</p><div className="is-three">{model.nopChips.map(chip)}</div><small className="pm-snippet-note">{model.definition}</small></div></section></div>}</section>;
  };
  // PM Genset menggunakan dua visual yang lebih operasional: komposisi status
  // dan perbandingan kendala antar-NOP. PM Site/Dashboard tetap memakai visual
  // sebelumnya melalui komponen dasar agar ruang lingkup perubahan tetap aman.
  const PMAttentionChartsClassic=window.PMAttentionCharts;
  const GENSET_GROUPS=[
    ['done','Selesai','#4f8667'],
    ['active','Masih berjalan','#3979a5'],
    ['waiting','Menunggu approval','#e27b2b'],
    ['exception','Take Out & Rejected','#c45a68'],
    ['other','Status lain','#94a3b8']
  ];
  const gensetGroup=status=>/take\s*out|rejected/i.test(String(status))?'exception':/waiting|approval/i.test(String(status))?'waiting':/closed|completed/i.test(String(status))?'done':/submitted|progress|assigned|new/i.test(String(status))?'active':'other';
  const gensetPeriod=rows=>{const source=rows.find(row=>row.schedule_date||row.submitted_date)||{},date=String(source.schedule_date||source.submitted_date||'').slice(0,7);return date?new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}-01T00:00:00Z`)):'Periode aktif';};
  const gensetVisualModel=rows=>{
    const statuses=Object.entries(rows.reduce((all,row)=>{const label=row.status||'Status belum tersedia';all[label]=(all[label]||0)+1;return all;},{})).sort((a,b)=>b[1]-a[1]);
    const total=rows.length,groupValues=Object.fromEntries(GENSET_GROUPS.map(([key])=>[key,0]));
    statuses.forEach(([status,value])=>groupValues[gensetGroup(status)]+=value);
    const today=new Date(),todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`,byNop={};
    rows.forEach(row=>{const state=String(row.status||'').toUpperCase().replace(/[ _-]/g,''),rejected=state==='REJECTED',late=!row.submitted_date&&!/SUBMIT|APPROVAL|CLOSED|COMPLETED/.test(state)&&row.schedule_date&&row.schedule_date<todayKey;if(!rejected&&!late)return;const name=String(row.nop||'NOP belum tersedia').replace(/^NOP\s+/i,'').replace(/_/g,' ');byNop[name]=(byNop[name]||0)+1;});
    const top=Object.entries(byNop).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)).slice(0,8),totalIssues=top.reduce((sum,item)=>sum+item.value,0),average=top.length?totalIssues/top.length:0,max=Math.max(1,...top.map(item=>item.value)),step=[5,10,20,25,50,100,200].find(value=>value*4>=max)||Math.ceil(max/4);
    return {statuses,total,period:gensetPeriod(rows),groups:GENSET_GROUPS.map(([key,label,color])=>({key,label,color,value:groupValues[key]})).filter(item=>item.value>0),top,totalIssues,average,max:step*4};
  };
  const PMStatusPriorityImageClassic=window.PMStatusPriorityImage;
  window.PMStatusPriorityImage=async function(rows,opts={}){
    if(opts.variant!=='genset-bars')return PMStatusPriorityImageClassic(rows,opts);
    const model=gensetVisualModel(rows||[]),scale=2,width=1600,height=900,canvas=opts.createCanvas?opts.createCanvas(width*scale,height*scale):document.createElement('canvas');
    canvas.width=width*scale;canvas.height=height*scale;const context=canvas.getContext('2d');context.scale(scale,scale);
    const text=(value,x,y,size=16,color='#173e68',weight=500,align='left')=>{context.font=`${weight} ${size}px Poppins, Segoe UI, Arial, sans-serif`;context.fillStyle=color;context.textAlign=align;context.fillText(String(value),x,y);};
    const panel=(x,title)=>{context.fillStyle='#fbfcfe';context.fillRect(x,132,744,690);context.strokeStyle='#d8e1eb';context.strokeRect(x+.5,132.5,743,689);text(title,x+28,177,16,'#53657a',600);text(model.period,x+716,177,13,'#64748b',500,'right');};
    context.fillStyle='#fff';context.fillRect(0,0,width,height);context.fillStyle='#173e68';context.fillRect(0,0,width,12);text('RINGKASAN OPERASIONAL',40,54,12,'#77899e',600);text('STATUS & PRIORITAS PM GENSET',40,92,27,'#263f5f',600);text(model.period,1560,92,16,'#64748b',500,'right');panel(40,'KOMPOSISI STATUS PM');panel(816,'TOP NOP KENDALA');
    text(new Intl.NumberFormat('id-ID').format(model.total),68,242,46,'#173e68',600);text('Plan PM Genset',68,267,15,'#728298',500);
    let cursor=68;const barWidth=688;model.groups.forEach(group=>{const size=barWidth*group.value/Math.max(model.total,1);context.fillStyle=group.color;context.fillRect(cursor,290,Math.max(size-2,1),46);if(size>58)text(new Intl.NumberFormat('id-ID').format(group.value),cursor+size/2,320,16,'#fff',600,'center');cursor+=size;});
    let legendX=68;model.groups.forEach(group=>{context.fillStyle=group.color;context.fillRect(legendX,360,12,12);text(`${group.label} ${Math.round(group.value/Math.max(model.total,1)*100)}%`,legendX+18,371,12,'#607086',500);legendX+=178;});
    text('STATUS',68,424,11,'#7b8a9c',600);text('JUMLAH',690,424,11,'#7b8a9c',600,'right');text('%',756,424,11,'#7b8a9c',600,'right');model.statuses.slice(0,10).forEach(([status,value],index)=>{const y=442+index*31,group=GENSET_GROUPS.find(([key])=>key===gensetGroup(status));context.fillStyle='#e0e7ef';context.fillRect(68,y,688,1);context.fillStyle=group[2];context.fillRect(68,y+10,12,12);text(titleCase(status),90,y+21,13,'#607086',500);text(new Intl.NumberFormat('id-ID').format(value),690,y+21,13,'#173e68',600,'right');text((value/Math.max(model.total,1)*100).toFixed(1).replace('.',',')+'%',756,y+21,13,'#8090a2',500,'right');});
    const left=986,right=1495,top=238,row=50,x=value=>left+(right-left)*value/model.max;[0,1,2,3,4].forEach(index=>{const value=model.max/4*index,xPos=x(value);context.strokeStyle=index?'#e2e9f0':'#b7c5d4';context.beginPath();context.moveTo(xPos,top-12);context.lineTo(xPos,top+Math.max(model.top.length,1)*row);context.stroke();text(value,xPos,top+Math.max(model.top.length,1)*row+24,11,'#8a99ab',500,'center');});
    if(model.top.length){const avg=x(model.average);context.setLineDash([6,5]);context.strokeStyle='#6f7f93';context.beginPath();context.moveTo(avg,top-16);context.lineTo(avg,top+model.top.length*row);context.stroke();context.setLineDash([]);text(`Rata-rata ${model.average.toFixed(1).replace('.',',')}`,avg,top-24,11,'#52657c',600,'center');}
    model.top.forEach((item,index)=>{const y=top+index*row+10,width=Math.max(x(item.value)-left,2),high=item.value>=model.average;context.fillStyle=high?'#3979a5':'#aec8da';context.fillRect(left,y,width,26);splitLabel(item.name,18).slice(0,2).forEach((line,lineIndex)=>text(line.toUpperCase(),left-14,y+17+(lineIndex?12:0),11,'#596b80',600,'right'));text(item.value,left+width+10,y+18,16,'#173e68',600);});
    context.fillStyle='#3979a5';context.fillRect(844,664,12,12);text('Di atas rata-rata',864,675,12,'#607086',500);context.fillStyle='#aec8da';context.fillRect(1014,664,12,12);text('Di bawah rata-rata',1034,675,12,'#607086',500);context.setLineDash([6,5]);context.strokeStyle='#6f7f93';context.beginPath();context.moveTo(1195,670);context.lineTo(1220,670);context.stroke();context.setLineDash([]);text(`Rata-rata ${model.average.toFixed(1).replace('.',',')}`,1230,675,12,'#607086',500);
    context.fillStyle='#f1f5f9';context.fillRect(844,716,326,76);context.fillRect(1184,716,326,76);text('TOTAL KENDALA',862,741,10,'#728298',600);text(model.totalIssues,862,776,31,'#173e68',600);text('NOP TERDAMPAK',1202,741,10,'#728298',600);text(model.top.length,1202,776,31,'#173e68',600);text('Kendala = status Rejected, atau jadwal terlewat tanpa Submitted Date.',844,808,12,'#64748b',500);text('Automated Operations System',40,866,12,'#64748b',500);return canvas;
  };
  window.PMAttentionCharts=function({rows=[],loading,kind}){
    if(kind!=='genset')return <PMAttentionChartsClassic rows={rows} loading={loading} kind={kind}/>;
    const model=gensetVisualModel(rows),pct=value=>(value/Math.max(model.total,1)*100).toFixed(1).replace('.',',')+'%',format=value=>new Intl.NumberFormat('id-ID').format(value),barLeft=150,barRight=520,barTop=32,rowHeight=38,chartHeight=barTop+Math.max(model.top.length,1)*rowHeight+32,x=value=>barLeft+(barRight-barLeft)*value/model.max;
    const download=async()=>{try{saveBlob(await window.PMStatusPriorityImage(rows,{variant:'genset-bars'}),`status-prioritas-pm-genset-${String(model.period).replace(/\s+/g,'-').toLowerCase()}.png`);}catch(error){window.alert('Gambar belum dapat dibuat: '+error.message);}};
    const statusTable=<table className="pm-genset-status-table"><thead><tr><th>Status</th><th>Jumlah</th><th>%</th></tr></thead><tbody>{model.statuses.map(([status,value])=>{const group=GENSET_GROUPS.find(([key])=>key===gensetGroup(status));return <tr key={status}><td><i style={{background:group[2]}}/>{titleCase(status)}</td><td>{format(value)}</td><td>{pct(value)}</td></tr>;})}</tbody></table>;
    const stack=<div className="pm-genset-stack"><div className="pm-genset-total"><strong>{format(model.total)}</strong><span>Plan PM Genset</span></div><div className="pm-genset-stack-bar" role="img" aria-label={`Komposisi status PM Genset, ${model.total} plan`}>{model.groups.map(group=>{const width=group.value/Math.max(model.total,1)*100;return <span key={group.key} style={{width:`${width}%`,background:group.color}} title={`${group.label}: ${format(group.value)} (${pct(group.value)})`}>{width>=9?format(group.value):''}</span>;})}</div><ul className="pm-genset-stack-legend">{model.groups.map(group=><li key={group.key}><i style={{background:group.color}}/>{group.label}<b>{pct(group.value)}</b></li>)}</ul></div>;
    const hbar=<div className="pm-genset-hbar"><svg viewBox={`0 0 560 ${chartHeight}`} role="img" aria-label="Jumlah kendala PM Genset per NOP">{[0,1,2,3,4].map(index=>{const value=model.max/4*index,xPos=x(value);return <g key={index}><line className={index?'pm-genset-grid':'pm-genset-axis'} x1={xPos} y1={barTop-9} x2={xPos} y2={barTop+Math.max(model.top.length,1)*rowHeight}/><text className="pm-genset-tick" x={xPos} y={barTop+Math.max(model.top.length,1)*rowHeight+20} textAnchor="middle">{value}</text></g>;})}{model.top.map((item,index)=>{const y=barTop+index*rowHeight+7,width=Math.max(x(item.value)-barLeft,2),above=item.value>=model.average;return <g key={item.name}><rect className={above?'pm-genset-bar is-high':'pm-genset-bar'} x={barLeft} y={y} width={width} height="22"/><text className="pm-genset-name" x={barLeft-11} y={y+15} textAnchor="end">{item.name.toUpperCase()}</text><text className="pm-genset-value" x={barLeft+width+8} y={y+16}>{item.value}</text></g>;})}{model.top.length>0&&<><line className="pm-genset-average" x1={x(model.average)} y1={barTop-12} x2={x(model.average)} y2={barTop+model.top.length*rowHeight}/><text className="pm-genset-average-label" x={x(model.average)} y={barTop-16} textAnchor="middle">Rata-rata {model.average.toFixed(1).replace('.',',')}</text></>}</svg></div>;
    return <section className="pm-snippet-visuals pm-genset-visuals" aria-busy={loading?'true':'false'}><div className="pm-snippet-head"><div><p>RINGKASAN OPERASIONAL</p><h3>STATUS & PRIORITAS PM GENSET</h3></div><button type="button" className="pm-export-button pm-export-image" onClick={download}>↓ Download Image</button></div>{loading?<p className="pm-attention-note">Memuat grafik…</p>:<div className="pm-snippet-row"><section className="pm-snippet-panel"><header><h4>KOMPOSISI STATUS PM</h4><span>{model.period}</span></header>{model.total?<div className="pm-genset-stack-wrap">{stack}{statusTable}</div>:<p className="pm-chart-empty">Tidak ada data status PM Genset pada filter ini.</p>}<p className="pm-genset-caption">Status dikelompokkan agar progres operasional mudah dibaca tanpa menghilangkan rincian status asli.</p></section><section className="pm-snippet-panel"><header><h4>TOP NOP KENDALA</h4><span>{model.period}</span></header>{model.top.length?hbar:<p className="pm-chart-empty">Tidak ada kendala pada periode ini.</p>}<div className="pm-genset-key"><i className="is-high"/> Di atas rata-rata <i/> Di bawah rata-rata <b/> Rata-rata {model.average.toFixed(1).replace('.',',')}</div><div className="pm-genset-mini"><span>TOTAL KENDALA<strong>{format(model.totalIssues)}</strong></span><span>NOP TERDAMPAK<strong>{format(model.top.length)}</strong></span></div><p className="pm-genset-caption">Kendala = status Rejected, atau jadwal terlewat tanpa Submitted Date.</p></section></div>}</section>;
  };
  const unavailable='Data belum tersedia';
  const value=v=>v===null||v===undefined||v===''||v==='-'?unavailable:String(v);
  const number=v=>v===null||v===undefined?unavailable:new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(v);
  const date=v=>v?new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(v.slice(0,10)+'T00:00:00Z')):unavailable;
  const timestamp=v=>v?`${date(v)}${v.length>10?' · '+v.slice(11,16):''}`:unavailable;
  const statusOptions=['Belum dievaluasi','Perlu ditinjau','Terverifikasi bermasalah','Tidak berkaitan dengan PM','Menunggu verifikasi lapangan','Selesai dievaluasi'];
  const tone=v=>/Out SLA|Tinggi|bermasalah/i.test(v)?'red':/stabil|In SLA|Selesai dievaluasi|^Ya$/i.test(v)?'green':/belum|tersedia|^Tidak$/i.test(v)?'gray':'orange';
  const tag=(v,color)=> <span className={`genset-tag is-${color||tone(value(v))}`}>{value(v)}</span>;
  const panel=(title,children)=> <section className="corporate-panel genset-panel"><h3 className="section-title">{title}</h3>{children}</section>;
  const fields=pairs=><dl className="genset-fields">{pairs.map(([label,item])=><div key={label}><dt>{label}</dt><dd>{item===null||item===undefined||item===''?unavailable:item}</dd></div>)}</dl>;
  async function request(url,options){const res=await fetch(url,options);const data=await res.json();if(!res.ok)throw Error(data.detail||'Permintaan gagal.');return data;}
  function Map({master}){
    const lat=master?.latitude,lon=master?.longitude;
    const valid=Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180&&!(lat===0&&lon===0);
    if(!valid)return <aside className="corporate-panel genset-map genset-empty">Koordinat belum tersedia</aside>;
    const bbox=`${lon-.008},${lat-.005},${lon+.008},${lat+.005}`;
    return <aside className="corporate-panel genset-map"><div className="genset-map-viewport"><iframe title={`Lokasi genset ${master.site_id}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`} loading="eager" referrerPolicy="no-referrer"/></div><div><strong>{value(master.city||master.province)}</strong><span>{lat}, {lon}</span><a className="pm-site-link" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`} target="_blank" rel="noreferrer">Buka peta penuh ↗</a></div></aside>;
  }
  function Comparison({metric}){
    const max=Math.max(metric.before||0,metric.after||0);
    return <article className="corporate-panel genset-comparison"><h4>{metric.label}</h4><div className="genset-comparison-values"><div><span>Sebelum</span><strong>{number(metric.before)}</strong></div><div><span>Sesudah</span><strong>{number(metric.after)}</strong></div></div><div className="genset-bars">{[['Sebelum',metric.before,'before'],['Sesudah',metric.after,'after']].map(([label,v,period])=><div key={period}><span>{label}</span><div className="genset-bar-track"><span className={`is-${period}`} style={{width:v===null?'0%':max?`${v/max*100}%`:'0%'}}/></div></div>)}</div><div className="genset-comparison-footer">{tag(metric.change,metric.change==='Meningkat'?'orange':metric.change==='Menurun'?'green':'gray')}<span>{metric.zero_baseline?'Muncul setelah PM':metric.percent!==null?`${metric.percent>0?'+':''}${number(metric.percent)}%`:metric.before===0&&metric.after===0?'Tidak ada kejadian tercatat':metric.complete?'': 'Persentase belum dapat dievaluasi'}</span></div><p>{metric.unit} · {metric.complete?'Cakupan terkonfirmasi':'Cakupan/durasi/SLA perlu konfirmasi'}</p></article>;
  }
  class Timeline extends R.Component {
    constructor(props){super(props);this.state={selected:null};}
    componentDidUpdate(previous){if(previous.detail.rules.windowDays!==this.props.detail.rules.windowDays)this.setState({selected:null});}
    render(){
      const {detail}=this.props,{selected}=this.state;
      const rows=[...(detail.anchor?[{id:'pm',occurred_at:detail.anchor,kind:'PM',ticket_no:detail.pm.ticket_no,duration_minutes:null}]:[]),...detail.events].sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at));
      const max=Math.max(0,...rows.filter(row=>row.kind==='GGR').map(row=>row.duration_minutes||0));
      return panel('Timeline durasi GGR',<div><div className="genset-legend">{tag('PM','navy')}{tag('GGR','orange')}{tag('Ticket Power In SLA','green')}{tag('Ticket Power Out SLA','red')}{tag('SLA / durasi belum tersedia','gray')}</div><p className="genset-note">Blok GGR membandingkan durasi dalam menit. Ticket yang berdekatan membutuhkan verifikasi evaluator.</p><div className="genset-timeline">{rows.map(row=>{
        const color=row.kind==='PM'?'navy':row.kind==='GGR'?'orange':row.sla_state==='Out SLA'?'red':row.sla_state==='In SLA'?'green':'gray';
        const related=(detail.timeline_related||detail.related).find(item=>item.ggr_id===row.id)?.ticket_ids||[];
        return <button key={row.id} className={`genset-event is-${color}`} aria-expanded={selected?.id===row.id} onClick={()=>this.setState({selected:selected?.id===row.id?null:row})}><span className="genset-event-date">{timestamp(row.occurred_at)}</span><span className="genset-event-content"><strong>{row.kind==='PM'?detail.anchor_label==='setelah PM selesai'?'Closed PM':'Submission PM':row.kind}</strong><span>{value(row.ticket_no)}{row.period?' · '+row.period:''}</span>{row.kind==='GGR'?<span className="genset-duration-track">{row.duration_minutes===null?<span className="genset-note">Durasi belum tersedia</span>:<span style={{width:max?`${Math.max(2,row.duration_minutes/max*100)}%`:'0%'}}/>}</span>:null}<span>{row.kind==='GGR'?`${number(row.duration_minutes)}${row.duration_minutes===null?'':' menit'} · ${related.length} ticket Power berdekatan`:row.kind==='PM'?'Acuan evaluasi':value(row.sla_state)}</span></span></button>;
      })}</div>{!rows.length&&<p className="genset-empty">Belum cukup bukti untuk timeline.</p>}{selected&&<div className="genset-selected"><strong>{value(selected.ticket_no)}</strong>{fields([['Waktu',timestamp(selected.occurred_at)],['Jenis',selected.kind],['Durasi',selected.kind==='PM'?'Acuan evaluasi':selected.duration_minutes===null?unavailable:`${number(selected.duration_minutes)} menit`],['RCA tercatat',value(selected.rc1||selected.rc_category)],['Resolution',value(selected.resolution)]])}{selected.kind==='GGR'&&<p>Ticket Power berdekatan: {detail.events.filter(row=>((detail.timeline_related||detail.related).find(item=>item.ggr_id===selected.id)?.ticket_ids||[]).includes(row.id)).map(row=>row.ticket_no).join(', ')||'Bukti belum cukup'}</p>}</div>}</div>);
    }
  }
  function Analysis({detail,SummaryCard}){
    const r=detail.reliability;
    if(!detail.anchor){
      const {pm,master}=detail,m=master||{};
      const yesNo=v=>v===''||v===undefined||v===null?unavailable:/true|yes|^ya$|^1$/i.test(String(v))?'Ya':'Tidak';
      const readiness=[
        ['STATUS PM',value(pm.status),'Status pekerjaan dari RAW PM','navy'],
        ['SUMBER DAYA',value(pm.type_power),'Peran kelistrikan pada site','orange'],
        ['KAPASITAS GENSET',m.genset_capacity>0?number(m.genset_capacity):unavailable,'Kapasitas dari Master Site','green'],
        ['GENSET AKTIF',yesNo(m.genset_active),'Kesiapan aset dari Master Site','red']
      ];
      return <div className="space-y-4"><div className="genset-readiness is-gray"><strong>Ringkasan kesiapan PM Genset</strong><p>Evaluasi menampilkan data pekerjaan dan aset kelistrikan yang tersedia. Perbandingan gangguan sebelum dan sesudah PM baru ditampilkan jika waktu pelaksanaan PM tersedia.</p><span>Fokus pada status pekerjaan, fungsi daya, spesifikasi genset, jadwal, dan PIC</span></div><div className="genset-grid-four">{readiness.map(([label,v,detailText,color])=><SummaryCard key={label} label={label} value={v} detail={detailText} tone={color}/>)}</div>{panel('Kesiapan operasional genset',fields([['Tipe Genset',value(m.genset_type||pm.type_power)],['Sistem Power',value(pm.scope_item_name||m.type_power)],['Kapasitas',m.genset_capacity>0?`${number(m.genset_capacity)} kVA`:unavailable],['Maintenance Terakhir',date(m.genset_last_maintenance||pm.last_maintenance)],['Jadwal PM',date(pm.schedule_date)],['PIC PM',String(pm.pic||'').trim()||'Belum ditugaskan'],['Interval PM',value(pm.interval)],['Site ID',value(pm.site_id)],['Regional / NOP',`${value(m.regional||pm.regional)} · ${value(m.nop||pm.nop)}`]]))}</div>;
    }

    return <div className="space-y-4"><div className={`genset-readiness is-${tone(detail.priority)}`}><strong>{detail.status}</strong><p>{detail.reasons.join(' ')}</p><span>{detail.anchor_label} · {detail.rules.windowDays} hari per jendela · prioritas {detail.priority}</span></div>{panel('Perbandingan sebelum & sesudah PM',<div><p className="genset-note">{detail.windows?`${date(detail.windows.before_start)} hingga sebelum ${timestamp(detail.windows.before_end)} · sesudah ${timestamp(detail.windows.after_start)} hingga sebelum ${timestamp(detail.windows.after_end)}`:'Acuan PM belum tersedia.'}</p>{detail.date_only&&<p className="genset-note">Hari submission dikeluarkan karena urutan waktu belum diketahui.</p>}<div className="genset-grid-four">{detail.metrics.map(metric=><Comparison key={metric.label} metric={metric}/>)}</div></div>)}<div className="genset-grid-four">{[['MENUJU GGR PERTAMA',r.first_ggr_days,'hari'],['JEDA RATA-RATA ANTAR-GGR',r.average_gap_days,'hari'],['DURASI GGR TERLAMA',r.longest_minutes,'menit'],['SEJAK GGR TERAKHIR',r.days_since_last,'hari']].map(([label,v,unit],i)=><SummaryCard key={label} label={label} value={v===null?unavailable:`${number(v)} ${unit}`} detail="GGR pada jendela sesudah acuan PM" tone={['navy','green','orange','red'][i]}/>)}</div><Timeline detail={detail}/>{panel('Hubungan bukti operasional',<div><div className="genset-evidence-flow">{[['GGR pasca-PM',detail.anchor&&detail.coverage.ggr.available?detail.evidence.ggr:null],['Ticket Power terkait',detail.anchor&&(detail.coverage.swfm.available||detail.coverage.inap.available)?detail.evidence.related_power:null],['Ticket Out SLA',detail.anchor&&(detail.coverage.swfm.available||detail.coverage.inap.available)?detail.evidence.out_sla:null],['Prioritas',detail.priority]].map(([label,v],i)=><div key={label}><span>{label}</span><strong>{typeof v==='number'||v===null?number(v):v}</strong>{i<3&&<span className="genset-flow-arrow" aria-hidden="true">→</span>}</div>)}</div><p className="genset-note">Site ID sama, RCA/kategori Power tercatat, dan selisih waktu ±{detail.rules.nearHours} jam atau interval ticket mencakup GGR. Hubungan ini bersifat indikatif.</p></div>)}{panel('Ringkasan evaluasi sistem',<div className="genset-grid-two">{[['Fakta',detail.facts],['Indikasi',detail.reasons],['Bukti yang belum tersedia',detail.unavailable],['Aksi yang disarankan',detail.actions]].map(([label,items])=><section className="genset-summary" key={label}><h4>{label}</h4><ul>{items.map((item,i)=><li key={i}>{item}</li>)}</ul></section>)}</div>)}{panel('Aturan & cakupan evaluasi',<div><p className="genset-note">GGR dalam {detail.rules.earlyDays} hari, peningkatan jumlah/durasi, atau pengulangan → perlu ditinjau. GGR dengan ticket terkait Out SLA → prioritas tinggi. Stabil hanya jika cakupan sumber dikonfirmasi. Tidak ada skor atau keputusan RCA otomatis.</p>{fields(Object.entries(detail.coverage).map(([source,c])=>[source.toUpperCase(),`${c.available?'Sumber tersedia':'Data belum tersedia'} · ${c.full?'Dua jendela terkonfirmasi':'Cakupan belum terkonfirmasi'}${c.observed?' · kejadian tercatat '+date(c.observed.start)+' - '+date(c.observed.end):''}`]))}</div>)}</div>;
  }
  function Information({detail}){
    const {pm,master}=detail,m=master||{};
    const active=v=>v===''||v===undefined||v===null?unavailable:/true|yes|^ya$|^1$|aktif/i.test(String(v))?'Aktif':'Tidak aktif';
    const pic=String(pm.pic||'').trim()||'Belum ditugaskan';
    return <div className="genset-grid-two">{panel('Profil Genset',fields([['Status Genset',tag(active(m.genset_active))],['Tipe Genset',value(m.genset_type||pm.type_power)],['Kapasitas',m.genset_capacity>0?`${number(m.genset_capacity)} kVA`:unavailable],['Sistem Power',value(pm.scope_item_name||m.type_power)],['Maintenance Terakhir',date(m.genset_last_maintenance||pm.last_maintenance)]]))}{panel('Informasi Ticket PM',fields([['Ticket PM',value(pm.ticket_no)],['Jadwal PM',date(pm.schedule_date)],['Status',tag(pm.status)],['PIC PM',pic],['Interval PM',value(pm.interval)]]))}</div>;
  }
  class History extends R.Component {
    constructor(props){super(props);this.state={period:'',source:'',sla:'',severity:'',kind:'',selected:null};}
    render(){
      const {detail}=this.props,s=this.state;
      const select=(label,name,options)=><label className="pm-site-form-field"><span className="filter-label">{label}</span><select className="control p-2" value={s[name]} onChange={e=>this.setState({[name]:e.target.value})}><option value="">Semua</option>{options.map(v=><option key={v}>{v}</option>)}</select></label>;
      const rows=detail.events.filter(row=>(!s.period||row.period===s.period)&&(!s.source||row.lineage.some(item=>item.source.toUpperCase()===s.source))&&(!s.sla||row.sla_state===s.sla)&&(!s.severity||value(row.severity)===s.severity)&&(!s.kind||row.kind===s.kind));
      return <div className="space-y-4"><div className="corporate-panel genset-history-filters">{select('PERIODE','period',['Sebelum','Sesudah','Hari PM · perlu konfirmasi'])}{select('SUMBER','source',['GGR','SWFM','INAP'])}{select('SLA','sla',['In SLA','Out SLA',unavailable])}{select('SEVERITY','severity',[...new Set(detail.events.map(row=>value(row.severity)))])}{select('JENIS','kind',['GGR','Ticket Power'])}</div><p className="genset-note">{rows.length} kejadian tercatat pada dua jendela dan hari PM. Ticket SWFM/INAP dengan parent sama digabung; GGR tetap terpisah.</p><div className="corporate-panel genset-table-scroll"><table className="preventive-table genset-history"><thead className="bg-[#173E68] text-white"><tr>{['Waktu kejadian','Jenis','Sumber','Durasi','Ticket INAP','Ticket WFM','Severity','Status','SLA','RCA','Resolution category','PIC'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{timestamp(row.occurred_at)}<small>{row.period}</small></td><td>{row.kind}{row.kind==='GGR'&&<small>{row.ticket_no}</small>}</td><td>{row.lineage.map(item=>item.source.toUpperCase()).join(' / ')}</td><td>{row.duration_minutes===null?unavailable:`${number(row.duration_minutes)} menit`}</td><td>{row.lineage.filter(item=>item.source==='inap').map(item=>item.ticket_no).join(', ')||value(row.parent_ticket)}</td><td>{row.lineage.filter(item=>item.source==='swfm').map(item=><button key={item.ticket_no} className="pm-site-link" onClick={()=>this.setState({selected:row})}>{item.ticket_no}</button>)}{!row.lineage.some(item=>item.source==='swfm')&&unavailable}</td><td>{value(row.severity)}</td><td>{value(row.status)}</td><td>{tag(row.sla_state)}</td><td>{value(row.rc1||row.rc_category)}</td><td>{value(row.resolution_category)}</td><td>{value(row.pic)}</td></tr>)}</tbody></table>{!rows.length&&<p className="genset-empty">{detail.anchor?'Tidak ada kejadian yang sesuai filter pada sumber tersedia.':'Belum dapat dievaluasi: acuan PM belum tersedia.'}</p>}</div>{s.selected&&panel('Detail ticket '+s.selected.ticket_no,<div><button className="pm-site-back" onClick={()=>this.setState({selected:null})}>Tutup detail</button>{fields([['Summary',value(s.selected.summary)],['RCA tercatat',value(s.selected.rc1)],['Resolution action',value(s.selected.resolution)],['Ticket terkait',s.selected.lineage.map(item=>`${item.source.toUpperCase()}: ${item.ticket_no}`).join(' · ')]])}<p className="genset-note">Deep link ticket belum tersedia pada sumber; detail sumber ditampilkan di sini.</p></div>)}</div>;
    }
  }
  class Evaluation extends R.Component {
    constructor(props){super(props);this.state={form:{evaluation_status:'Belum dievaluasi',follow_up_pic:'',conclusion:'',follow_up_action:'',target_date:'',additional_note:'',...props.detail.evaluation,target_date:props.detail.evaluation?.target_date?.slice(0,10)||''},busy:false,error:'',notice:''};}
    async save(event){event.preventDefault();this.setState({busy:true,error:'',notice:''});try{const saved=await request('/api/pm-genset/evaluation',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...this.state.form,id:this.props.detail.id})});this.setState({form:{...saved,target_date:saved.target_date?.slice(0,10)||''},notice:'Hasil evaluasi tersimpan di MySQL.'});this.props.onSaved(saved);}catch(error){this.setState({error:error.message});}finally{this.setState({busy:false});}}
    render(){const {form,busy,error,notice}=this.state,{detail}=this.props;const change=(name,v)=>this.setState(current=>({form:{...current.form,[name]:v}}));
      return panel('Hasil evaluasi manual',<form onSubmit={e=>this.save(e)}><p className="genset-note">Diisi evaluator. Terhubung dengan {detail.pm.site_id}, ticket {value(detail.pm.ticket_no)}, dan periode PM {date(detail.pm.schedule_date)}. Status resmi ticket tetap berasal dari sumber.</p>{detail.read_only&&<p className="pm-site-banner">Preview read-only. MySQL diperlukan untuk menyimpan hasil evaluasi.</p>}{error&&<p className="pm-site-error" role="alert">{error}</p>}{notice&&<p className="pm-site-success" role="status">{notice}</p>}<div className="genset-grid-two"><label className="pm-site-form-field"><span className="filter-label">Status evaluasi</span><select className="control p-2" value={form.evaluation_status} onChange={e=>change('evaluation_status',e.target.value)}>{statusOptions.map(v=><option key={v}>{v}</option>)}</select></label>{[['PIC tindak lanjut','follow_up_pic','text'],['Target penyelesaian','target_date','date']].map(([label,name,type])=><label className="pm-site-form-field" key={name}><span className="filter-label">{label}</span><input className="control p-2" type={type} maxLength={255} value={form[name]} onChange={e=>change(name,e.target.value)} onInput={e=>change(name,e.target.value)}/></label>)}</div>{[['Kesimpulan evaluator','conclusion'],['Aksi tindak lanjut','follow_up_action'],['Catatan tambahan','additional_note']].map(([label,name])=><label className="pm-site-form-field mt-3" key={name}><span className="filter-label">{label}</span><textarea className="control p-3" rows="3" maxLength={10000} value={form[name]} onChange={e=>change(name,e.target.value)} onInput={e=>change(name,e.target.value)}/></label>)}<div className="genset-evaluation-actions"><button className="btn-primary pm-site-evaluation-button px-4 py-2" disabled={busy||detail.read_only||!detail.pm.ticket_no}>{busy?'Menyimpan…':'Simpan hasil evaluasi'}</button><span>{form.updated_at?'Diperbarui '+timestamp(form.updated_at):'Belum ada evaluasi manual tersimpan'}</span></div></form>);
    }
  }
  class Detail extends R.Component {
    constructor(props){super(props);this.state={tab:0};}
    render(){const {detail,back,onSaved,onWindow,SummaryCard}=this.props,{tab}=this.state,{pm,master}=detail,m=master||{},labels=['Analisis','Informasi PM & Genset','Riwayat Gangguan','Hasil Evaluasi'];
      const keyDown=(e,i)=>{const next=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:null;if(next!==null){e.preventDefault();this.setState({tab:next});document.getElementById('genset-tab-'+next).focus();}};
      return <div className="genset-detail space-y-4"><header className="genset-header"><div className="genset-identity"><button className="pm-site-back" onClick={back}>← Kembali ke PM Genset</button><p className="pm-site-eyebrow">{pm.site_id}</p><h2>{value(m.site_name||pm.site_name)}</h2><p className="genset-note">{value(pm.ticket_no)}</p><div className="genset-header-tags">{tag('PM Genset','navy')}{tag(m.genset_capacity>0?`${number(m.genset_capacity)} kVA`:unavailable,'gray')}{tag(pm.status)}{tag(detail.evaluation?.evaluation_status||'Belum dievaluasi')}{tag(/backup/i.test(pm.type_power)?'Backup Power':/main/i.test(pm.type_power)?'Main Power':value(pm.type_power),'navy')}</div><p className="genset-region">{value(m.nop||pm.nop)} · {value(m.regional||pm.regional).replace(/_/g,' ')}</p></div><Map master={master}/></header><div className="genset-window">{detail.anchor?[<span key="anchor">Acuan: {timestamp(detail.anchor)} · {detail.anchor_label}</span>,<label key="window">Jendela perbandingan <select className="control" aria-label="Jendela perbandingan genset" value={detail.rules.windowDays} onChange={e=>onWindow(Number(e.target.value))}>{[...new Set([detail.rules.windowDays,7,14,30])].sort((a,b)=>a-b).map(v=><option key={v} value={v}>{v} hari</option>)}</select></label>]:<span>Fokus evaluasi: kesiapan pekerjaan dan aset kelistrikan genset</span>}</div><div className="pm-site-tabs" role="tablist" aria-label="Detail PM Genset">{labels.map((label,i)=><button id={'genset-tab-'+i} key={label} role="tab" aria-selected={tab===i} aria-controls={'genset-panel-'+i} tabIndex={tab===i?0:-1} onClick={()=>this.setState({tab:i})} onKeyDown={e=>keyDown(e,i)}>{label}</button>)}</div><div role="tabpanel" id={'genset-panel-'+tab} aria-labelledby={'genset-tab-'+tab}>{tab===0?<Analysis detail={detail} SummaryCard={SummaryCard}/>:tab===1?<Information detail={detail}/>:tab===2?<History detail={detail}/>:<Evaluation detail={detail} onSaved={onSaved}/>}</div></div>;
    }
  }
  class Workspace extends R.Component {
    constructor(props){super(props);this.state={detail:null,selected:null,windowDays:null,error:'',loading:false};this.sequence=0;}
    componentWillUnmount(){this.sequence++;}
    async open(row,windowDays=this.state.windowDays){const token=++this.sequence;this.setState({loading:true,error:'',selected:row,windowDays});const id=`genset|${String(row.ticket_no||'').trim()||`${String(row.site_id).trim().toUpperCase()}|${row.schedule_date}|${row.scope_item_name||''}`}`;try{const params=new URLSearchParams({id});if(windowDays!==null)params.set('window_days',windowDays);const detail=await request('/api/pm-genset/detail?'+params);if(token===this.sequence)this.setState({detail,windowDays:detail.rules.windowDays},()=>window.scrollTo({top:0,behavior:'auto'}));}catch(error){if(token===this.sequence)this.setState({error:error.message});}finally{if(token===this.sequence)this.setState({loading:false});}}
    render(){const {RoutinePage,SummaryCard,...props}=this.props,s=this.state;return <div className="genset-workspace">{s.error&&<p className="pm-site-error" role="alert">{s.error}</p>}{s.loading&&<p className="genset-note" role="status">Memuat evaluasi genset…</p>}{s.detail?<Detail detail={s.detail} SummaryCard={SummaryCard} back={()=>{this.sequence++;this.setState({detail:null,selected:null,error:'',loading:false});}} onWindow={days=>this.open(s.selected,days)} onSaved={evaluation=>this.setState(current=>({detail:{...current.detail,evaluation}}))}/>:<RoutinePage {...props} onOpenGenset={row=>this.open(row)}/>}</div>;}
  }
  const PMAttentionChartsBase = window.PMAttentionCharts;
  window.PMAttentionCharts = function(props) {
    const chart = <PMAttentionChartsBase {...props} />;
    return props?.kind === 'site' && window.PMPunchlistCoverage ? R.createElement(R.Fragment, null, chart, R.createElement(window.PMPunchlistCoverage, { rows: props.rows })) : chart;
  };
  window.PMGensetWorkspace=Workspace;
})();
