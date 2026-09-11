import path from 'node:path'
import {fileURLToPath} from 'node:url'
import dotenv from 'dotenv'

export const SERVER_DIR=path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT=path.dirname(SERVER_DIR)
dotenv.config({path:path.join(SERVER_DIR,'.env')})
export const RUNS_DIR=path.join(PROJECT_ROOT,'data','runs')
export const WEB_DIR=path.join(PROJECT_ROOT,'web')
export const TEMPLATE_PATH=path.join(SERVER_DIR,'templates','Book1.xlsx')
