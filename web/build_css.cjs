const fs = require('fs')
const path = require('path')

const tailwindRoot = (() => {
  try { return path.dirname(require.resolve('tailwindcss/package.json')) }
  catch { return '/opt/nvm/versions/node/v22.16.0/lib/node_modules/tailwindcss' }
})()
const { compile } = require(path.join(tailwindRoot, 'dist', 'lib.js'))
const root = __dirname
const source = fs.readFileSync(path.join(root, 'src', 'main.jsx'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const candidates = new Set()

for (const match of source.matchAll(/(?:className|class)=\"([^\"]+)\"/g)) {
  match[1].split(/\s+/).filter(Boolean).forEach(x => candidates.add(x))
}
for (const match of source.matchAll(/[\'\"`]([^\'\"`]{1,500})[\'\"`]/g)) {
  const value = match[1]
  if (!value.includes('-') && !value.includes('[')) continue
  value.split(/\s+/).forEach(token => {
    token = token.replace(/^\$\{[^}]*\}/, '').replace(/\$\{[^}]*\}$/, '').trim()
    if (/^[!\w:@\[\]#().,%/+.-]+$/.test(token)) candidates.add(token)
  })
}
;['bg-white','bg-slate-300','border-slate-300','text-white','text-slate-500','text-slate-700','font-semibold','animate-spin','disabled:cursor-not-allowed','disabled:border-slate-300','disabled:bg-slate-300'].forEach(x=>candidates.add(x))

const theme = fs.readFileSync(path.join(tailwindRoot, 'theme.css'), 'utf8')
;(async () => {
  const compiler = await compile(theme + '\n@tailwind utilities;')
  const generated = compiler.build([...candidates])
  const custom = fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8').replace('@import "tailwindcss";', '')
  fs.writeFileSync(path.join(root, 'static', 'app.css'), generated + '\n' + custom)
  console.log(`Tailwind CSS v4 compiled with ${candidates.size} candidates.`)
})()
