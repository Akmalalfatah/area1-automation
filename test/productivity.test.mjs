import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import ExcelJS from 'exceljs';
import vm from 'node:vm';
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'productivity-test-'));
process.env.USE_DATABASE='false';process.env.APP_DATA_DIR=temporary;
const p=await import('../server/productivity.js');
after(async()=>{if(path.basename(temporary).startsWith('productivity-test-'))await fs.rm(temporary,{recursive:true,force:true});});
const row=(overrides={},i=2)=>p.productivityRow({TICKETNUMBERSWFM:'DUPLICATE',PICTAKEOVERTICKET:'PIC A',REGIONAL:'R01_Sumbagut',NOP:'NOP MEDAN',SITEID:'TEST1',TAKEOVERDATE:'2026-10-01 23:30:00',CHECKINAT:'2026-10-02 01:00:00',RHSTART:0,RHSTOP:2,RHSTARTTIME:'2026-10-03 02:00:00',RHSTOPTIME:'2026-10-03 04:00:00',RH:2,...overrides},i);
test('each activity belongs to its own day; RH starts at backup day, numeric zero is recorded',()=>{
  const rows=[row()];assert.equal(p.measureProductivity(rows,'2026-10-01').take_over,1);assert.equal(p.measureProductivity(rows,'2026-10-01').check_in,0);
  assert.equal(p.measureProductivity(rows,'2026-10-02').check_in,1);assert.equal(p.measureProductivity(rows,'2026-10-02').backup,0);
  const backup=p.measureProductivity(rows,'2026-10-03');assert.equal(backup.backup,1);assert.equal(backup.rh,2);assert.equal(backup.backup_percent,null);
});
test('Count semantics preserve duplicate tickets, cached RH and anomaly thresholds',()=>{
  const rows=[row({RH:999.99},2),row({RH:1000},3),row({RH:-1},4)];const m=p.measureProductivity(rows,'');
  assert.equal(m.take_over,3);assert.equal(m.check_in,3);assert.equal(m.backup,3);assert.equal(m.rh,1998.99);assert.equal(m.anomalies,2);assert.equal(m.backup_percent,100);
  assert.equal(row({PICTAKEOVERTICKET:''}),null);assert.equal(row({REGIONAL:'R03_Elsewhere'}),null);
});
test('Excel dates do not shift calendar day and invalid dates stay unavailable',()=>{
  assert.equal(p.productivityDate(46272.5),'2026-09-07T12:00:00');assert.equal(p.productivityDate('31/02/2026'),null);assert.equal(p.productivityDate('14/09/2026 22:26:50'),'2026-09-14T22:26:50');
});
test('bundled September workbook reconciles to independently inspected Sheet2 grand total',async()=>{
  const seed=JSON.parse(gunzipSync(await fs.readFile(new URL('../server/data/productivity-swfm-default.json.gz',import.meta.url))));
  const m=p.measureProductivity(seed.rows,'');assert.equal(seed.roster.length,577);assert.equal(m.take_over,10650);assert.equal(m.check_in,7600);assert.equal(m.backup,2309);assert.equal(m.rh,2280414.61);assert.equal(m.anomalies,13);
});
test('SWFM parser retains raw row counts for productivity without changing existing PM deduplication',async()=>{
  const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet('Sheet1');const headers=['Ticket Number SWFM','PIC Take Over Ticket','Regional','NOP','Site Id','Occured Time','Take Over Date','Check In At','RH Start','RH Stop','RH Start Time','RH Stop Time','RH'];ws.addRow(headers);
  for(let i=0;i<2;i++)ws.addRow(['DUP','PIC X','R01_Sumbagut','NOP MEDAN','TEST1','2026-10-01','2026-10-01','2026-10-02',0,2,'2026-10-03','2026-10-03',{formula:'J2-I2',result:2}]);
  const {parseSiteSource}=await import('../server/pm-site.js');const data=await parseSiteSource(await wb.xlsx.writeBuffer(),'swfm');assert.equal(data.rows.length,1);assert.equal(data.productivity.rows.length,2);assert.equal(p.measureProductivity(data.productivity.rows,'').rh,4);
});
test('daily summary, regional paging, detail and role settings persist without guessing types',async()=>{
  const rows=Array.from({length:55},(_,i)=>row({PICTAKEOVERTICKET:'PIC '+i},i+2));rows.push(row({RHSTARTTIME:'2026-10-02',RH:4,PICTAKEOVERTICKET:'PIC 0'},100));
  await p.saveProductivitySnapshot(p.buildProductivityDataset(rows),'Test SWFM.xlsx','2026-10-04');
  let summary=await p.productivitySummary({date:'2026-10-02'});assert.equal(summary.total.check_in,56);assert.equal(summary.total.backup,1);assert.equal(summary.total.backup_percent,1.79);
  const region=await p.productivityRegion('R01_Sumbagut',{date:'2026-10-02'});assert.equal(region.pics.length,50);assert.ok(region.pagination.total_pages>=2); // Existing PIC roster must not disappear when a smaller upload arrives.
  const pic=region.pics.find(x=>x.pic==='PIC 0');assert.equal(pic.role,'unmapped');
  const detail=await p.productivityTickets({date:'2026-10-02',pic_id:pic.id});assert.equal(detail.tickets.length,2);assert.equal(detail.tickets[0].activities.take_over,false);assert.equal(detail.tickets[0].activities.check_in,true);
  await p.saveProductivityPics({ids:[pic.id],role:'MBP'});summary=await p.productivitySummary({date:'2026-10-02',role:'MBP',search:'PIC 0'});assert.equal(summary.total.total_pics,1);assert.equal(summary.total.check_in,2);
  await p.saveProductivityPics({ids:[pic.id],active:false});summary=await p.productivitySummary({date:'2026-10-02',role:'MBP',search:'PIC 0'});assert.equal(summary.total.total_pics,0);assert.equal(summary.total.backup_percent,null);
  const config=JSON.parse(await fs.readFile(path.join(temporary,'productivity/pic-settings.json')));assert.equal(config[pic.id].role,'MBP');assert.equal(config[pic.id].active,false);
});
test('new source replaces one month instead of accumulating repeated uploads and preserves roster',async()=>{
  const dataset=p.buildProductivityDataset([row({PICTAKEOVERTICKET:'NEW PIC'},200)]);
  await p.saveProductivitySnapshot(dataset,'New SWFM.xlsx','2026-10-05');await p.saveProductivitySnapshot(dataset,'New SWFM.xlsx','2026-10-05');
  const s=await p.productivitySummary({date:'2026-10-01'});assert.equal(s.total.take_over,1);assert.equal(s.source.filename,'New SWFM.xlsx');
  const roster=await p.productivityRoster({search:'PIC 54'});assert.equal(roster.pagination.total,1);
});
test('invalid filters, region and role updates reject instead of silently returning wrong data',async()=>{
  await assert.rejects(()=>p.productivitySummary({date:'2026-02-31'}),{status:422});await assert.rejects(()=>p.productivitySummary({role:'GUESS'}),{status:422});await assert.rejects(()=>p.productivityRegion('R03'),{status:404});await assert.rejects(()=>p.saveProductivityPics({ids:['missing'],role:'MBP'}),{status:404});
});
test('dates outside available source are explicitly marked unavailable',async()=>{
  const s=await p.productivitySummary({date:'2026-11-16'});assert.equal(s.data_available,false);
  await assert.rejects(()=>p.productivitySummary({date:['2026-09-14']}),{status:422});
});
test('page renders with bundled legacy React without Fragment or hooks',async()=>{
  const sandbox={React:{Component:class {},createElement:(type,props,...children)=>{assert.ok(type,'Undefined React component');return{type,props:{...props,children}};}},window:{},location:{search:''},URLSearchParams};
  vm.runInNewContext(await fs.readFile(new URL('../web/static/productivity.js',import.meta.url),'utf8'),sandbox);
  const page=new sandbox.window.ProductivityWorkspace({});page.render();
  const data=await p.productivitySummary({date:'2026-09-14'});page.renderSummary(data);
  const region=await p.productivityRegion('R02_Sumbagsel',{date:'2026-09-14'});page.renderRegion(region);
  assert.equal(typeof sandbox.window.ProductivityWorkspace,'function');
});
test('PIC name identifies type first; unnamed types use BPS or TS ticket prefixes',()=>{
  assert.equal(p.productivityNameRole('BPS003-JBI-Nama'),'MBP');assert.equal(p.productivityNameRole('MBP-OKI-Nama'),'MBP');assert.equal(p.productivityNameRole('TS-MDN-Nama'),'TS');
  assert.equal(p.productivityNameRole('SATRIA'),null);assert.equal(p.productivityTicketRole('BPS-2026-001'),'MBP');assert.equal(p.productivityTicketRole('TS-2026-002'),'TS');assert.equal(p.productivityTicketRole('OTHER-001'),'unmapped');
});
test('mixed ticket types are split by role without duplicating totals; manual corrections can return to automatic',async()=>{
  const event={PICTAKEOVERTICKET:'AUTOMATIC TEST PERSON',TAKEOVERDATE:'2026-12-01',CHECKINAT:'2026-12-01',RHSTARTTIME:'2026-12-01'};
  const rows=[row({...event,TICKETNUMBERSWFM:'BPS-2026-001',RH:3},2),row({...event,TICKETNUMBERSWFM:'TS-2026-002',RH:5},3),row({...event,PICTAKEOVERTICKET:'TS-NAMED TEST PERSON',TICKETNUMBERSWFM:'BPS-2026-003',RH:7},4)];
  await p.saveProductivitySnapshot(p.buildProductivityDataset(rows),'Automatic SWFM.xlsx','2026-12-01');
  const q={date:'2026-12-01',search:'AUTOMATIC TEST PERSON'};
  const all=await p.productivitySummary(q),mbp=await p.productivitySummary({...q,role:'MBP'}),ts=await p.productivitySummary({...q,role:'TS'});
  assert.equal(all.total.active_pics,1);assert.equal(all.total.take_over,2);assert.equal(mbp.total.take_over,1);assert.equal(mbp.total.rh,3);assert.equal(ts.total.take_over,1);assert.equal(ts.total.rh,5);
  const region=await p.productivityRegion('R01_Sumbagut',q),pic=region.pics[0];assert.deepEqual(pic.roles,['MBP','TS']);
  const tickets=await p.productivityTickets({...q,role:'TS',pic_id:pic.id});assert.equal(tickets.tickets.length,1);assert.equal(tickets.tickets[0].ticket_no,'TS-2026-002');
  const named=await p.productivitySummary({date:'2026-12-01',search:'TS-NAMED TEST PERSON',role:'TS'});assert.equal(named.total.take_over,1);
  await p.saveProductivityPics({ids:[pic.id],role:'MBP'});assert.equal((await p.productivitySummary({...q,role:'MBP'})).total.take_over,2);
  await p.saveProductivityPics({ids:[pic.id],role:'auto'});assert.equal((await p.productivitySummary({...q,role:'MBP'})).total.take_over,1);
});
test('regional NOP options exclude other regions and an obsolete NOP cannot silently hide data',async()=>{
  const r01=await p.productivityRegion('R01_Sumbagut',{date:'2026-09-14'});
  assert.ok(r01.nops.includes('MEDAN'));assert.ok(!r01.nops.includes('JAMBI'));assert.ok(!r01.nops.includes('BATAM'));
  const r02=await p.productivityRegion('R02_Sumbagsel',{date:'2026-09-14'});assert.ok(r02.nops.includes('JAMBI'));assert.ok(!r02.nops.includes('MEDAN'));
  const invalid=await p.productivityRegion('R01_Sumbagut',{date:'2026-09-14',nop:'JAMBI'});assert.equal(invalid.nop,'');assert.deepEqual(invalid.summary,r01.summary);
  const medan=await p.productivityRegion('R01_Sumbagut',{date:'2026-09-14',nop:'MEDAN'});assert.equal(medan.nop,'MEDAN');assert.ok(medan.pics.every(pic=>pic.nops.includes('MEDAN')));assert.ok(medan.pics.length<=50);
});
test('summary has three filters, regional view adds NOP, and ticket detail has no filters',async()=>{
  const sandbox={React:{Component:class {},createElement:(type,props,...children)=>({type,props:{...props,children}})},window:{},location:{search:'?nop=JAMBI'},URLSearchParams};
  vm.runInNewContext(await fs.readFile(new URL('../web/static/productivity.js',import.meta.url),'utf8'),sandbox);
  const page=new sandbox.window.ProductivityWorkspace({}),nodes=[];
  const walk=node=>{if(Array.isArray(node)){node.forEach(walk);return;}if(node&&typeof node==='object'){nodes.push(node);walk(node.props?.children);}};
  walk(page.renderFilters());assert.equal(page.state.nop,'');assert.deepEqual(nodes.filter(x=>x.type==='label').map(x=>x.props.children[0].props.children[0]),['Tanggal','Jenis PIC','Search']);
  page.state.regional='R01_Sumbagut';page.state.meta={regional:'R01_Sumbagut',nops:['MEDAN']};nodes.length=0;walk(page.renderFilters());assert.equal(nodes.filter(x=>x.type==='label').length,4);assert.equal(nodes.find(x=>x.type==='select').props['aria-label'],'NOP Productivity');
  page.state.picId='test';assert.equal(page.renderFilters(),null);nodes.length=0;walk(page.renderTickets({pic:{pic:'Test',regional:'R01_Sumbagut',nops:['MEDAN'],role:'TS'},tickets:[],pagination:null}));assert.equal(nodes.filter(x=>x.type==='input'||x.type==='select').length,0);
});
