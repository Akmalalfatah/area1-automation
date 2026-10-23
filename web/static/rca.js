(() => {
  const h=React.createElement;
  const api=async(path,options={})=>{
    const response=await fetch(path,{...options,headers:{'content-type':'application/json',...(options.headers||{})}});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.detail||'Permintaan RCA gagal.');
    return body;
  };
  const format=value=>Number(value||0).toLocaleString('id-ID');
  const dateLabel=value=>value?String(value).replace('T',' ').replace(/\.\d+Z?$/,''):'-';
  // NA/N-A from the source denotes an uninvestigated RCA. Do not let it hide
  // a valid ARC or ARCD value from the other column.
  const rcaValue=value=>{const text=String(value??'').trim();return /^(?:n\/?a|n\.a\.?)$/i.test(text)?'':text;};
  const arcArcdText=row=>[rcaValue(row.arc),rcaValue(row.arcd)].filter(Boolean).join(' · ')||'Under Investigation';
  const DEFAULT_TEMPLATE='🚨 Alarm Down {nop}\n(Last Update: {last_update})\n\nSite | Tech | Class | Event Time\n\n{duration_groups}';
  const downloadText=(text,filename)=>{const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);};
  const CopyIcon=()=>h('svg',{width:17,height:17,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.8',strokeLinecap:'square',strokeLinejoin:'miter','aria-hidden':'true'},h('rect',{x:8,y:8,width:12,height:12}),h('path',{d:'M16 8V4H4v12h4'}));
  const SettingsIcon=()=>h('svg',{width:17,height:17,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:'1.8',strokeLinecap:'square',strokeLinejoin:'miter','aria-hidden':'true'},h('path',{d:'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4'}),h('circle',{cx:16,cy:6,r:2}),h('circle',{cx:8,cy:12,r:2}),h('circle',{cx:14,cy:18,r:2}));
  const Filter=({label,value,onChange,items,all='Semua'})=>h('div',{className:'rca-filter'},h('label',null,label),h('select',{value,onChange:event=>onChange(event.target.value)},h('option',{value:''},all),...(items||[]).map(item=>h('option',{key:item,value:item},item))));
  const Metric=({label,value,detail,tone=''})=>h('article',{className:`rca-metric ${tone}`},h('p',null,label),h('strong',null,format(value)),h('span',null,detail));
  const BarList=({title,items})=>{const max=Math.max(1,...(items||[]).map(item=>item.value));return h('section',{className:'rca-panel'},h('h3',null,title),...(items||[]).slice(0,7).map(item=>h('div',{className:'rca-bar-row',key:item.label},h('div',{className:'rca-bar-label'},item.label),h('div',{className:'rca-track'},h('i',{style:{width:`${Math.round(item.value/max*100)}%`}})),h('b',null,format(item.value)))));};

  class RCAWorkspace extends React.Component {
    constructor(props){super(props);let templateConfig=DEFAULT_TEMPLATE;try{templateConfig=localStorage.getItem('rca-template-format')||DEFAULT_TEMPLATE;}catch{}this.state={snapshots:[],sheet:'',filters:{nop:'',duration:'',root_cause:'',search:''},data:null,loading:true,syncing:false,error:'',template:'',copyNotice:'',settingsOpen:false,templateConfig};}
    componentDidMount(){this.loadSnapshots();}
    query(sheet=this.state.sheet,filters=this.state.filters){return new URLSearchParams(Object.entries({sheet,...filters}).filter(([,value])=>value)).toString();}
    async loadSnapshots(preferredSheet=''){
      this.setState({loading:true,error:''});
      try{const result=await api('/api/rca/snapshots'),snapshots=result.items||[],sheet=preferredSheet||this.state.sheet||snapshots[0]?.sheet_name||'';this.setState({snapshots,sheet},()=>this.loadDashboard());}
      catch(error){this.setState({error:error.message,loading:false,data:null});}
    }
    async loadDashboard(){
      const sheet=this.state.sheet;if(!sheet){this.setState({data:null,loading:false});return;}
      this.setState({loading:true,error:''});
      try{const data=await api(`/api/rca/dashboard?${this.query()}`);this.setState({data,loading:false});}
      catch(error){this.setState({error:error.message,data:null,loading:false});}
    }
    setFilter(key,value){this.setState(state=>({filters:{...state.filters,[key]:value},template:''}),()=>this.loadDashboard());}
    setSheet(sheet){this.setState({sheet,template:''},()=>this.loadDashboard());}
    async sync(){this.setState({syncing:true,error:''});try{const result=await api('/api/rca/sync',{method:'POST',body:JSON.stringify({})});await this.loadSnapshots(result.sheets?.[0]?.sheet_name||'');}catch(error){this.setState({error:error.message});}finally{this.setState({syncing:false});}}
    buildTemplate(){
      const data=this.state.data,rows=data?.rows||[];
      if(!rows.length)return '';
      const order=['>1day','12-24hrs','8-12hrs','4-8hrs','0-4hrs'];
      const groups=order.map(label=>[label,rows.filter(row=>row.duration_bucket===label)]).filter(([,items])=>items.length);
      const lines=groups.map(([label,items])=>`Duration: ${label}\n${items.map((row,index)=>{const site=[row.site_id,String(row.site_name||'').replace(/\s+/g,'')].filter(Boolean).join('_')||'-';return `↳ ${index+1}. ${site} | ${row.tech||'-'} | ${row.class_site||'-'} | ${dateLabel(row.down_date)} *${arcArcdText(row)}*`;}).join('\n')}`).join('\n\n');
      const nop=this.state.filters.nop||'SEMUA NOP',updated=dateLabel(data.snapshot?.source_updated_at||data.snapshot?.synced_at);
      return (this.state.templateConfig||DEFAULT_TEMPLATE).replaceAll('{nop}',nop).replaceAll('{last_update}',updated).replaceAll('{duration_groups}',lines);
    }
    generate(){const template=this.buildTemplate();if(!template){this.setState({error:'Tidak ada alarm RCA sesuai filter aktif untuk dibuatkan template.'});return;}this.setState({template,error:''});}
    async copyTemplate(){const template=this.buildTemplate();if(!template){this.setState({error:'Tidak ada alarm RCA sesuai filter aktif untuk disalin.'});return;}let copied=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(template);copied=true;}}catch{}if(!copied){const area=document.createElement('textarea');area.value=template;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.focus();area.select();copied=document.execCommand('copy');area.remove();}this.setState({template,copyNotice:copied?'Template berhasil disalin. Silakan paste ke Notes atau catatan.':'Browser menolak akses clipboard. Gunakan Download TXT.',error:copied?'':'Gagal menyalin otomatis.'});}
    saveTemplateSettings(){try{localStorage.setItem('rca-template-format',this.state.templateConfig);}catch{}this.setState({settingsOpen:false,copyNotice:'Format template disimpan pada browser ini.'});}
    render(){
      const s=this.state,data=s.data,options=data?.filters||{};
      return h('div',{className:'rca-workspace space-y-4'},
        h('section',{className:'corporate-panel rca-hero'},h('div',null,h('p',{className:'pm-img-eyebrow'},'RELIABILITY & RCA'),h('h2',{className:'section-title'},'RCA ALARM DOWN'),h('p',null,'Sinkronisasi Google Sheets untuk monitoring alarm, analisis gangguan, dan template operational update.')),h('button',{type:'button',className:'pm-export-button pm-export-image',onClick:()=>this.sync(),disabled:s.syncing},s.syncing?'Menyinkronkan...':'Sync RCA Google Sheets')),
        s.error&&h('div',{className:'rca-alert'},s.error),s.copyNotice&&h('div',{className:'rca-copy-notice'},s.copyNotice),
        !s.snapshots.length&&!s.loading&&h('section',{className:'corporate-panel rca-empty'},h('h3',null,'Belum ada snapshot RCA'),h('p',null,'Klik Sync RCA Google Sheets untuk menarik data dari sumber online.')),
        s.snapshots.length>0&&h('section',{className:'corporate-panel p-5'},h('div',{className:'rca-filter-row'},h(Filter,{label:'SNAPSHOT RCA',value:s.sheet,onChange:value=>this.setSheet(value),items:s.snapshots.map(item=>item.sheet_name),all:'Pilih Snapshot'}),h(Filter,{label:'NOP',value:s.filters.nop,onChange:value=>this.setFilter('nop',value),items:options.nop_options}),h(Filter,{label:'DURATION',value:s.filters.duration,onChange:value=>this.setFilter('duration',value),items:options.duration_options}),h(Filter,{label:'ARC / ARCD',value:s.filters.root_cause,onChange:value=>this.setFilter('root_cause',value),items:options.root_cause_options}),h('div',{className:'rca-filter rca-search'},h('label',null,'SEARCH'),h('input',{value:s.filters.search,onChange:event=>this.setFilter('search',event.target.value),placeholder:'Cari Site, ARC, atau ARCD'}))),data&&h('p',{className:'rca-meta'},`Snapshot ${data.snapshot.sheet_name} · sumber: ${dateLabel(data.snapshot.source_updated_at||data.snapshot.synced_at)} · ${format(data.snapshot.row_count)} record`)),
        data&&h('div',{className:'grid grid-cols-3 gap-4'},h(Metric,{label:'TOTAL ALARM DOWN',value:data.summary.total,detail:'Sesuai filter aktif',tone:'navy'}),h(Metric,{label:'DURATION > 1 HARI',value:data.summary.over_day,detail:'Prioritas aging tertinggi',tone:'red'}),h(Metric,{label:'NOP TERDAMPAK',value:data.summary.nop_affected,detail:'NOP pada filter aktif',tone:'green'})),
        data&&h('div',{className:'grid grid-cols-2 gap-4'},h(BarList,{title:'ACTUAL ROOT CAUSE (ARC)',items:data.by_arc}),h(BarList,{title:'DISTRIBUSI ALARM PER NOP',items:data.by_nop})),
        data&&h('section',{className:'corporate-panel p-5'},
          h('div',{className:'rca-section-head'},
            h('div',null,h('p',{className:'pm-img-eyebrow'},'ALARM DOWN'),h('h2',{className:'section-title'},'DAFTAR SITE RCA')),
            h('div',{className:'rca-copy-actions'},h('button',{type:'button',className:'rca-copy-template',onClick:()=>this.copyTemplate(),disabled:!data.rows.length},h(CopyIcon),h('span',null,'Copy AI Report')),h('button',{type:'button',className:'rca-template-settings','aria-label':'Pengaturan template',onClick:()=>this.setState({settingsOpen:true,copyNotice:''})},h(SettingsIcon)))
          ),
          h('div',{className:'rca-table-wrap'},h('table',{className:'rca-table'},
            h('thead',null,h('tr',null,...['SITE','NOP','TECH','CLASS','EVENT TIME','DURATION','ARC / ARCD'].map(label=>h('th',{key:label},label)))),
            h('tbody',null,...data.rows.map((row,index)=>h('tr',{key:`${row.site_id}-${row.down_date}-${index}`},
              h('td',null,h('b',null,row.site_id),h('small',null,row.site_name||'-')),h('td',null,row.nop||'-'),h('td',null,row.tech||'-'),h('td',null,row.class_site||'-'),h('td',null,dateLabel(row.down_date)),h('td',null,h('span',{className:'rca-duration'},row.duration_bucket)),h('td',null,arcArcdText(row))
            )))
          ))
        ),
        s.template&&h('section',{className:'corporate-panel rca-template'},h('div',{className:'rca-section-head'},h('div',null,h('p',{className:'pm-img-eyebrow'},'TEMPLATE UPDATE'),h('h2',{className:'section-title'},'ALARM DOWN NOP')),h('button',{type:'button',className:'pm-export-button pm-export-excel',onClick:()=>downloadText(s.template,'RCA-Alarm-Down.txt')},'Download TXT')),h('pre',null,s.template)),
        s.settingsOpen&&h('div',{className:'rca-settings-overlay',onClick:event=>event.target===event.currentTarget&&this.setState({settingsOpen:false})},h('section',{className:'rca-settings-dialog',role:'dialog','aria-modal':true,'aria-label':'Pengaturan template RCA'},h('header',null,h('div',null,h('p',{className:'pm-img-eyebrow'},'TEMPLATE RCA'),h('h2',{className:'section-title'},'Pengaturan Template')),h('button',{type:'button','aria-label':'Tutup',onClick:()=>this.setState({settingsOpen:false})},'×')),h('p',null,'Gunakan placeholder {nop}, {last_update}, dan {duration_groups}.'),h('textarea',{value:s.templateConfig,onChange:event=>this.setState({templateConfig:event.target.value}),rows:12}),h('footer',null,h('button',{type:'button',className:'btn-secondary',onClick:()=>this.setState({templateConfig:DEFAULT_TEMPLATE})},'Reset Default'),h('button',{type:'button',className:'btn-primary',onClick:()=>this.saveTemplateSettings()},'Simpan Template')))),
        s.loading&&h('p',{className:'rca-loading'},'Memuat data RCA...')
      );
    }
  }
  window.RCAWorkspace=RCAWorkspace;
})();
