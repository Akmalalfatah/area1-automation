import {normalizeSite,analyzeSite} from './pm-site.js'
import {analyzeGenset} from './pm-genset.js'

export function enrichWorkConditions(rows,data){
  const indexes=Object.fromEntries(['master','ggr','inap','swfm'].map(kind=>{
    const index=new Map()
    for(const row of data[kind]||[]){const id=normalizeSite(row.site_id);if(!index.has(id))index.set(id,[]);index.get(id).push(row)}
    return[kind,index]
  }))
  return rows.map(row=>{
    const id=normalizeSite(row.site_id),local={sources:data.sources||[]}
    for(const kind of Object.keys(indexes))if(Array.isArray(data[kind]))local[kind]=indexes[kind].get(id)||[]
    let count=0,ready=false
    if(row.maintenance_kind==='genset'){
      const detail=analyzeGenset(row,local)
      count=detail.events.filter(event=>event.period==='Sesudah').length
      ready=!!detail.anchor&&['ggr','swfm','inap'].every(kind=>Array.isArray(local[kind]))
    }else if(row.maintenance_kind==='site'){
      const detail=analyzeSite(row,local)
      count=detail.incidents.length
      ready=!!row.last_maintenance&&!detail.missing_sources.length
    }
    const condition=count?'Gangguan tercatat':row.review_reasons?.length?'Perlu ditinjau':!ready?'Belum dapat dievaluasi':'Tidak ada gangguan tercatat'
    return{...row,condition_label:condition,condition_tone:count?'red':row.review_reasons?.length?'orange':!ready?'gray':'green',condition_count:count}
  })
}
