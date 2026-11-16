import type * as http from 'node:http'
import path from 'node:path'
import launch from 'launch-editor'

type Middleware = (req: http.IncomingMessage, res: http.ServerResponse) => void
type ErrorCallback = (fileName: string, errorMessage: string | null) => void

/**
 * A middleware to launch an editor to open a file at a specific line and column.
 * The request url should have a `file` query parameter with the file path and
 * optional line and column numbers (e.g. "?file=/path/to/file.js:10:2").
 *
 * @param onErrorCallback Optional callback for handling errors.
 */
function launchEditorMiddleware(onErrorCallback?: ErrorCallback): Middleware

/**
 * A middleware to launch an editor to open a file at a specific line and column.
 * The request url should have a `file` query parameter with the file path and
 * optional line and column numbers (e.g. "?file=/path/to/file.js:10:2").
 *
 * @param specifiedEditor Optional editor command or path to use. Will be
 *   parsed using `shell-quote`.
 * @param onErrorCallback Optional callback for handling errors.
 */
function launchEditorMiddleware(
  specifiedEditor?: string,
  onErrorCallback?: ErrorCallback,
): Middleware

/**
 * A middleware to launch an editor to open a file at a specific line and column.
 * The request url should have a `file` query parameter with the file path and
 * optional line and column numbers (e.g. "?file=/path/to/file.js:10:2").
 *
 * @param specifiedEditor Optional editor command or path to use. Will be
 *   parsed using `shell-quote`.
 * @param srcRoot Optional source root directory to resolve relative file paths.
 * @param onErrorCallback Optional callback for handling errors.
 */
function launchEditorMiddleware(
  specifiedEditor?: string,
  srcRoot?: string,
  onErrorCallback?: ErrorCallback,
): Middleware
function launchEditorMiddleware(
  specifiedEditor?: string | ErrorCallback,
  srcRoot?: string | ErrorCallback,
  onErrorCallback?: ErrorCallback,
): Middleware {
  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  if (typeof srcRoot === 'function') {
    onErrorCallback = srcRoot
    srcRoot = undefined
  }

  srcRoot = srcRoot || process.cwd()

  return function middleware(req, res) {
    const requestUrl = req.url ?? ''
    const fullUrl = requestUrl.startsWith('http') ? requestUrl : `http://localhost${requestUrl}`
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

export default launchEditorMiddleware
