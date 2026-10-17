const path = require('path')
const { fileURLToPath } = require('url')

const positionRE = /:(\d+)(:(\d+))?$/
const windowsDriveRE = /^\/[a-z](?::|%3a)/i

module.exports = function parseFile(file) {
  // support `file://` protocol
  if (file.startsWith('file://')) {
    const url = new URL(file)
    // On Windows, `fileURLToPath` rejects file URLs without a drive letter
    // (e.g. `file:///src/main.js`) because they are not valid Windows paths.
    // Parse them as POSIX file URLs and let the path resolution below map
    // them onto the current drive.
    file =
      process.platform === 'win32' &&
      url.hostname === '' &&
      !windowsDriveRE.test(url.pathname)
        ? fileURLToPath(url, { windows: false })
        : fileURLToPath(url)
  }

  const unresolvedFileName = file.replace(positionRE, '')
  const fileName = unresolvedFileName ? path.resolve(unresolvedFileName) : ''

  const match = file.match(positionRE)
  const lineNumber = match && match[1]
  const columnNumber = match && match[3]

  return {
    fileName,
    lineNumber,
    columnNumber,
  }
}
