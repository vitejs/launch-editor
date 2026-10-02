const path = require('path')

const positionRE = /:(\d+)(:(\d+))?$/

module.exports = function parseFile(file) {
  // support `file://` protocol
  if (file.startsWith('file://')) {
    file = require('url').fileURLToPath(file)
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
