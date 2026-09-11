import('./server/index.js')
  .then(({default: app}) => {
    const port = Number(process.env.PORT || 3000)
    const host = process.env.HOST || '0.0.0.0'
    app.listen(port, host, () => console.log(`eKPI Automation: http://${host}:${port}`))
  })
  .catch(error => {
    console.error('Application startup failed:', error)
    process.exitCode = 1
  })