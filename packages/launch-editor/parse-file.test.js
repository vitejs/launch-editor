import { describe, expect, test } from 'vitest'
import path from 'node:path'

import parseFile from './parse-file.js'

describe('launchEditor path resolution', () => {
  test('does not resolve an empty file name to the working directory', () => {
    expect(parseFile(':1:1').fileName).toBe('')
  })

  test('resolves relative file names', () => {
    expect(parseFile(`.${path.sep}file.js:1:1`)).toStrictEqual({
      fileName: path.resolve('file.js'),
      lineNumber: '1',
      columnNumber: '1',
    })
  })

  test('resolves a parent-directory component created by a position suffix', () => {
    const project = path.resolve('project')
    const file = `${project}${path.sep}attacker-controlled${path.sep}..:1:1`

    expect(parseFile(file)).toStrictEqual({
      fileName: project,
      lineNumber: '1',
      columnNumber: '1',
    })
  })
})
