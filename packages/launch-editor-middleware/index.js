const path = require('path')
const launch = require('launch-editor')

module.exports = (specifiedEditor, srcRoot, onErrorCallback) => {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot
    srcRoot = undefined
  }

  srcRoot = srcRoot || process.cwd()

  return function launchEditorMiddleware(req, res) {
    const fullUrl = req.url.startsWith('http') ? req.url : `http://localhost${req.url}`
    const url = URL.parse(fullUrl)
    if (!url) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: invalid URL.`)
      return
    }

    const file = url.searchParams.get('file')
    if (!file) {
      res.statusCode = 500
      res.end(`launch-editor-middleware: required query param "file" is missing.`)
    } else {
      const resolved = file.startsWith('file://') ? file : path.resolve(srcRoot, file)
      launch(resolved, specifiedEditor, onErrorCallback)
      res.end()
    }
  }
}
