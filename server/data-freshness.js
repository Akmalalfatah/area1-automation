export const freshnessTypes=[['master','Master Site',null],['ggr','GGR',1],['inap','Ticket INAP',null],['swfm','Ticket SWFM',null],['kpi_b13_r01','KPIData B.1-B.3 R01 Sumbagut',null],['kpi_b13_r02','KPIData B.1-B.3 R02 Sumbagsel',null],['kpi_b13_r10','KPIData B.1-B.3 R10 Sumbagteng',null],['dashboard','PM Punchlist / Dashboard',1],['genset','PM Genset',1],['site','PM Site',1],['ekpi','eKPI Automation',1]]
export function buildFreshness(uploads,today){
  return freshnessTypes.map(([key,label,defaultDays])=>{
    const monthly=['inap','swfm','kpi_b13_r01','kpi_b13_r02','kpi_b13_r10'].includes(key),setting=process.env[`FRESHNESS_${key.toUpperCase()}_DAYS`],days=monthly?null:setting!==undefined&&Number.isInteger(Number(setting))&&Number(setting)>0?Number(setting):defaultDays
    const latest=uploads[key]||null,date=latest?.upload_date?.slice(0,10)
    const age=date?Math.round((Date.parse(today+'T00:00:00Z')-Date.parse(date+'T00:00:00Z'))/86400000):null
    const validDate=date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(age)&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date&&age>=0
    const needsUpdate=!!latest&&!!validDate&&(monthly?date.slice(0,7)<today.slice(0,7):!!days&&age>=days)
    const renewal=!latest?'Upload diperlukan':!validDate?'Tanggal perlu validasi':needsUpdate?'Jadwal pembaruan tiba':'Sesuai jadwal'
    return{key,label,latest,status:latest?'Tersedia':'Belum upload',renewal_label:renewal,needs_update:needsUpdate,age_days:age,cadence_days:days,cadence:monthly?'Perbulan':days===1?'Harian':days?`Setiap ${days} hari`:'Saat ada perubahan',needs_upload:!latest}
  })
}
