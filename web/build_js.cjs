const path = require('path')
const esbuild = require('esbuild')

const root = __dirname
const entry = path.join(root, 'src', 'main.jsx')
const outfile = path.join(root, 'static', 'app.js')

esbuild.buildSync({
  entryPoints: [entry],
  outfile,
  bundle: false,
  minify: false,
  target: ['es2018'],
  jsx: 'transform',
  loader: { '.jsx': 'jsx' },
  logLevel: 'info',
})

console.log(`Compiled ${path.relative(root, entry)} -> ${path.relative(root, outfile)}`)
