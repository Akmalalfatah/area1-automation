import path from 'node:path'
import {fileURLToPath} from 'node:url'
import dotenv from 'dotenv'

export const SERVER_DIR=path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT=path.dirname(SERVER_DIR)
dotenv.config({path:path.join(SERVER_DIR,'.env')})
dotenv.config({path:path.join(PROJECT_ROOT,'.env')})
export const DATA_DIR=process.env.APP_DATA_DIR?path.resolve(process.env.APP_DATA_DIR):path.join(PROJECT_ROOT,'data')
export const RUNS_DIR=path.join(DATA_DIR,'runs')
export const WEB_DIR=path.join(PROJECT_ROOT,'web')
export const TEMPLATE_PATH=path.join(SERVER_DIR,'templates','Book1.xlsx')
