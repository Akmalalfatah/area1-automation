import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {databaseEnabled,getPool} from '../server/db.js'

test('MySQL uploads survive server restart and feed both PM evaluations',{skip:!databaseEnabled},async()=>{
 assert.equal(process.env.DB_NAME,'pm_site_modular_test')
 const database='pm_sources_test_'+crypto.randomUUID().replaceAll('-',''),folder=await fs.mkdtemp(path.join(os.tmpdir(),'pm-sources-'))
 await getPool().query(`CREATE DATABASE ${database}`)
 try{
  const options={cwd:new URL('../',import.meta.url),env:{...process.env,DB_NAME:database,APP_DATA_DIR:folder}}
  await promisify(execFile)(process.execPath,['test/fixtures/source-persistence.mjs','upload'],options)
  await promisify(execFile)(process.execPath,['test/fixtures/source-persistence.mjs','reopen'],options)
 }finally{await getPool().query(`DROP DATABASE ${database}`);await getPool().end();await fs.rm(folder,{recursive:true,force:true})}
})
