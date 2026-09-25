const path = require('path')
const esbuild = require('esbuild')
const fs = require('node:fs')

const root = __dirname
const entry = path.join(root, 'src', 'main.jsx')
const outfile = path.join(root, 'static', 'app.js')

fs.writeFileSync(outfile, esbuild.transformSync(fs.readFileSync(entry, 'utf8'), { loader: 'jsx', target: 'es2018', jsx: 'transform' }).code)

fs.writeFileSync(path.join(root, 'static', 'pm-site.js'), esbuild.transformSync(fs.readFileSync(path.join(root, 'src', 'pm-site.jsx'), 'utf8'), { loader: 'jsx', target: 'es2018', jsx: 'transform', jsxFactory: 'R.createElement' }).code)

console.log(`Compiled ${path.relative(root, entry)} -> ${path.relative(root, outfile)}`)

fs.writeFileSync(path.join(root, 'static', 'pm-genset.js'), esbuild.transformSync(fs.readFileSync(path.join(root, 'src', 'pm-genset.jsx'), 'utf8'), { loader: 'jsx', target: 'es2018', jsx: 'transform', jsxFactory: 'R.createElement' }).code)
