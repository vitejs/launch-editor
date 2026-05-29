import http from 'http'

type Middleware = (req: http.IncomingMessage, res: http.ServerResponse) => void
type ErrorCallback = (fileName: string, errorMessage: string | null) => void

/**
 * A middleware to launch an editor to open a file at a specific line and column.
 * The request url should have a `file` query parameter with the file path and
 * optional line and column numbers (e.g. "?file=/path/to/file.js:10:2").
 *
 * @param onErrorCallback Optional callback for handling errors.
 */
declare function launchEditorMiddleware(onErrorCallback?: ErrorCallback): Middleware

/**
 * A middleware to launch an editor to open a file at a specific line and column.
 * The request url should have a `file` query parameter with the file path and
 * optional line and column numbers (e.g. "?file=/path/to/file.js:10:2").
 *
 * @param specifiedEditor Optional editor command or path to use. Will be
 *   parsed using `shell-quote`.
 * @param onErrorCallback Optional callback for handling errors.
 */
declare function launchEditorMiddleware(
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
declare function launchEditorMiddleware(
  specifiedEditor?: string,
  srcRoot?: string,
  onErrorCallback?: ErrorCallback,
): Middleware

export = launchEditorMiddleware
