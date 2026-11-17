import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import path from 'node:path'

import parseFile from './parse-file.js'

describe('launchEditor path resolution', () => {
  test('does not resolve an empty file name to the working directory', () => {
    assert.equal(parseFile(':1:1').fileName, '')
  })

  test('resolves relative file names', () => {
    assert.deepEqual(parseFile(`.${path.sep}file.js:1:1`), {
      fileName: path.resolve('file.js'),
      lineNumber: '1',
      columnNumber: '1',
    })
  })

  test('resolves a parent-directory component created by a position suffix', () => {
    const project = path.resolve('project')
    const file = `${project}${path.sep}attacker-controlled${path.sep}..:1:1`

    assert.deepEqual(parseFile(file), {
      fileName: project,
      lineNumber: '1',
      columnNumber: '1',
    })
  })
})
