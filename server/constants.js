export const REGION_NOPS = {
  R01_Sumbagut: ['NOP BANDA ACEH', 'NOP BINJAI', 'NOP MEDAN', 'NOP PADANG SIDEMPUAN', 'NOP PEMATANG SIANTAR', 'NOP RANTAU PRAPAT'],
  R02_Sumbagsel: ['NOP BENGKULU', 'NOP JAMBI', 'NOP LAMPUNG', 'NOP PALEMBANG', 'NOP PANGKAL PINANG'],
  R10_Sumbagteng: ['NOP BATAM', 'NOP BUKITTINGGI', 'NOP DUMAI', 'NOP PADANG', 'NOP PEKANBARU']
}

export const NOP_ORDER = Object.values(REGION_NOPS).flat()
export const NOP_TO_REGION = Object.fromEntries(Object.entries(REGION_NOPS).flatMap(([region, nops]) => nops.map(nop => [nop, region])))
export const BOOK1_START_COLUMNS = Object.fromEntries(NOP_ORDER.map((nop, index) => [nop, 3 + index * 3]))

export const ROW_DEFINITIONS = [
  {key:'kpi_score',label:'KPI Score',weight:100,type:'score',book1_row:4},
  {key:'category',label:'Kategori KPI',weight:null,type:'category',book1_row:5},
  {key:'A',label:'A. Availability Site NE Base Aggregate Cell',weight:null,type:'aggregate',book1_row:6},
  {key:'A_1',label:'Availability Site NE Base Aggregate Cell, Class Diamond per NOP',weight:1,type:'component',book1_row:7},
  {key:'A_2',label:'Availability Site NE 98 Base Aggregate Cell, Class Platinum per NOP',weight:5,type:'component',book1_row:8},
  {key:'A_3',label:'Availability Site NE 30 Base Aggregate Cell, Class Gold per NOP',weight:23,type:'component',book1_row:9},
  {key:'A_4',label:'Availability Site NE Base Aggregate Cell, Class Silver per NOP',weight:14,type:'component',book1_row:10},
  {key:'A_5',label:'Availability Site NE 95 Base Aggregate Cell, Class Bronze per NOP',weight:7,type:'component',book1_row:11},
  {key:'A_6',label:'Percentage Site Achieved Target Availability per NOP',weight:50,type:'component',book1_row:12},
  {key:'B',label:'B. Ticketing Activity & Alarm Handling',weight:null,type:'aggregate',book1_row:13},
  {key:'B_1',label:'Restoration Impact Service Incident Alarm',weight:42,type:'component',book1_row:14},
  {key:'B_2.1',label:'Restoration Potential Impact Service Non Incident Alarm Enva',weight:8.5,type:'component',book1_row:15},
  {key:'B_2.2',label:'Restoration Impact Service Non Incident Alarm Controller',weight:1,type:'component',book1_row:16},
  {key:'B_2.3',label:'Restoration Impact Service Non Incident Alarm Impact Service Alarm',weight:20,type:'component',book1_row:17},
  {key:'B_3',label:'Restoration Impact Service Degraded Service (P2 & P3) & Others alarm',weight:13.5,type:'component',book1_row:18},
  {key:'B_4.1',label:'Closing Ticket Supporting Pengembalian, Kehilangan dan Kerusakan Sparepart SPMS',weight:3.75,type:'component',book1_row:19},
  {key:'B_4.2',label:'Closing Ticket Supporting Others Non Alarm',weight:3.75,type:'component',book1_row:20},
  {key:'B_5.1',label:'WO Variable Activity Power & Non Power High Impact L1',weight:3.75,type:'component',book1_row:21},
  {key:'B_5.2',label:'WO Variable Activity Power & Non Power Low Impact L1',weight:3.75,type:'component',book1_row:22}
]

export const SOURCE_ROWS = {A:3,A_1:4,A_2:5,A_3:6,A_4:7,A_5:8,A_6:9,B:10,B_1:11,'B_2.1':12,'B_2.2':13,'B_2.3':14,B_3:15,'B_4.1':16,'B_4.2':17,'B_5.1':18,'B_5.2':19}
