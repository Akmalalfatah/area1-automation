import {normalizeSite,scheduleLabel} from './pm-site.js'
export function enrichDashboardReview(rows,data,today=new Date().toISOString().slice(0,10)){
  const masterIndex=new Map((data.master||[]).map(master=>[normalizeSite(master.site_id),master]))
  const normalize=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'')
  return rows.map(row=>{
    const master=masterIndex.get(normalizeSite(row.site_id))||null,reasons=[]
    const schedule=scheduleLabel(row,today)
    if(schedule.startsWith('Terlambat'))reasons.push(schedule+' · belum submit')
    if(schedule==='Jadwal belum tersedia')reasons.push('Jadwal PM perlu validasi')
    if(!row.status)reasons.push('Status PM belum tersedia')
    if(normalize(row.status)==='REJECTED')reasons.push('Pekerjaan ditolak; perlu tindak lanjut')
    if(!master)reasons.push('Site belum ditemukan pada Master Site')
    else{
      if(row.nop&&master.nop&&normalize(row.nop).replace(/^NOP/,'')!==normalize(master.nop).replace(/^NOP/,''))reasons.push('NOP pekerjaan berbeda dengan Master Site')
      if(['NO','N','TIDAK','FALSE','0'].includes(normalize(master.active)))reasons.push('Master Site menyatakan site tidak aktif')
      if(row.maintenance_kind==='genset'&&['NO','N','TIDAK','FALSE','0'].includes(normalize(master.genset_active)))reasons.push('Genset tidak aktif pada Master Site')
      if(master.latitude==null||master.longitude==null||!Number.isFinite(Number(master.latitude))||!Number.isFinite(Number(master.longitude))||Math.abs(master.latitude)>90||Math.abs(master.longitude)>180)reasons.push('Koordinat Master Site perlu validasi')
    }
    return{...row,master,review_reasons:reasons,review_label:reasons.length?'Perlu ditinjau':'Tidak ditemukan kendala jadwal/master',schedule_label:schedule}
  }).sort((a,b)=>b.review_reasons.length-a.review_reasons.length)
}
