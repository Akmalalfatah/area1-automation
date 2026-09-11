import fs from 'node:fs/promises'
import path from 'node:path'
import {strFromU8, strToU8, unzipSync, zipSync} from 'fflate'
import {DOMParser, XMLSerializer} from '@xmldom/xmldom'

const MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const parse=text=>new DOMParser().parseFromString(text,'application/xml')
const elements=(node,name)=>Array.from(node.getElementsByTagName(name))
export const columnNumber=column=>[...String(column).toUpperCase()].reduce((value,char)=>value*26+char.charCodeAt(0)-64,0)

function sheetTarget(files,name){
  const workbook=parse(strFromU8(files['xl/workbook.xml'])),sheet=elements(workbook,'sheet').find(item=>item.getAttribute('name')===name)
  if(!sheet)throw new Error(`Sheet '${name}' tidak ditemukan pada template.`)
  const rid=sheet.getAttributeNS(REL,'id')||sheet.getAttribute('r:id'),rels=parse(strFromU8(files['xl/_rels/workbook.xml.rels'])),relation=elements(rels,'Relationship').find(item=>item.getAttribute('Id')===rid)
  if(!relation)throw new Error(`Relasi sheet '${name}' tidak ditemukan.`)
  const target=relation.getAttribute('Target');return target.startsWith('/')?target.slice(1):path.posix.normalize(`xl/${target}`)
}

function cell(root,ref){const found=elements(root,'c').find(item=>item.getAttribute('r')===ref);if(!found)throw new Error(`Cell ${ref} tidak ditemukan pada template.`);return found}
function clear(cellNode){for(const child of Array.from(cellNode.childNodes))if(['f','v','is'].includes(child.localName||child.nodeName))cellNode.removeChild(child)}
function numeric(doc,node,value){clear(node);node.removeAttribute('t');const v=doc.createElementNS(MAIN,'v');v.appendChild(doc.createTextNode(value==null?'':String(Number(value))));node.appendChild(v)}
function text(doc,node,value){clear(node);node.setAttribute('t','inlineStr');const inline=doc.createElementNS(MAIN,'is'),t=doc.createElementNS(MAIN,'t');t.appendChild(doc.createTextNode(String(value??'')));inline.appendChild(t);node.appendChild(inline)}
function excelSerial(date){return (Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(1899,11,30))/86400000}

function setHiddenColumns(doc,root,hidden){
  const cols=elements(root,'cols')[0];if(!cols)return
  const original=elements(cols,'col'),attributes={}
  for(const col of original){const min=Number(col.getAttribute('min')||1),max=Number(col.getAttribute('max')||min);for(let n=min;n<=max;n++){attributes[n]={};for(const attr of Array.from(col.attributes))attributes[n][attr.name]=attr.value}}
  while(cols.firstChild)cols.removeChild(cols.firstChild)
  for(let n=1;n<=50;n++){const item=doc.createElementNS(MAIN,'col'),attrs={...(attributes[n]||{}),min:String(n),max:String(n)};if(hidden.has(n))attrs.hidden='1';else delete attrs.hidden;for(const [key,value] of Object.entries(attrs))item.setAttribute(key,value);cols.appendChild(item)}
}

function setRegionHeaders(doc,root,headers){
  const mergeCells=elements(root,'mergeCells')[0];if(!mergeCells)return
  for(const merge of elements(mergeCells,'mergeCell'))if(/^[A-Z]+1:[A-Z]+1$/.test(merge.getAttribute('ref')))mergeCells.removeChild(merge)
  for(const ref of ['C1','U1','AJ1'])text(doc,cell(root,ref),'')
  for(const [label,start,end] of headers){text(doc,cell(root,`${start}1`),label);if(start!==end){const merge=doc.createElementNS(MAIN,'mergeCell');merge.setAttribute('ref',`${start}1:${end}1`);mergeCells.appendChild(merge)}}
  mergeCells.setAttribute('count',String(elements(mergeCells,'mergeCell').length))
}

export async function patchTemplate({templatePath,values,strings,dates,hiddenColumns,regionHeaders,sheetName='Sep 2-4'}){
  const files=unzipSync(new Uint8Array(await fs.readFile(templatePath))),target=sheetTarget(files,sheetName),doc=parse(strFromU8(files[target])),root=doc.documentElement
  for(const [ref,value] of Object.entries(values))numeric(doc,cell(root,ref),value)
  for(const [ref,value] of Object.entries(strings))text(doc,cell(root,ref),value)
  for(const [ref,date] of Object.entries(dates)){const pseudo=new Date(Date.UTC(2000+date.getUTCDate(),date.getUTCMonth(),1));numeric(doc,cell(root,ref),excelSerial(pseudo))}
  setHiddenColumns(doc,root,hiddenColumns);setRegionHeaders(doc,root,regionHeaders)
  files[target]=strToU8(new XMLSerializer().serializeToString(doc))
  return Buffer.from(zipSync(files,{level:6}))
}
