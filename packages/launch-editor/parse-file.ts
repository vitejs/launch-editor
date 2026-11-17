import path from 'node:path'
import { fileURLToPath } from 'node:url'

const positionRE = /:(\d+)(:(\d+))?$/

export default function parseFile(file: string) {
  // support `file://` protocol
  if (file.startsWith('file://')) {
    file = fileURLToPath(file)
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
