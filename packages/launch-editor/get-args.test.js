const assert = require('node:assert/strict')
const os = require('node:os')
const { describe, test } = require('node:test')

const getArgumentsForFile = require('./get-args.js')

describe('getArgumentsForFile', () => {
  test('uses the file name as the only argument when no position is given', () => {
    assert.deepEqual(getArgumentsForFile('vim', 'file'), ['file'])
  })

  test('uses a relative path for files on a Windows drive in WSL', (t) => {
    if (process.platform !== 'linux') {
      t.skip('not running on Linux')
      return
    }

    t.mock.method(process, 'cwd', () => '/home/user/project')
    t.mock.method(os, 'release', () => '4.4.0-43-Microsoft')

    const fileName = '/mnt/c/project/file.js'
    assert.deepEqual(getArgumentsForFile('vim', fileName), ['../../../mnt/c/project/file.js'])
  })

  describe('editor-specific argument formats', () => {
    for (const editor of [
      'atom',
      'Atom',
      'Atom Beta',
      'subl',
      'sublime',
      'sublime_text',
      'wstorm',
      'charm',
      'zed',
    ]) {
      test(`${editor} uses "file:line:column"`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), ['file:10:5'])
      })
    }

    test('notepad++ uses -n/-c flags', () => {
      assert.deepEqual(getArgumentsForFile('notepad++', 'file', 10, 5), ['-n10', '-c5', 'file'])
    })

    for (const editor of ['vim', 'mvim']) {
      test(`${editor} uses +call cursor()`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), [
          '+call cursor(10, 5)',
          'file',
        ])
      })
    }

    for (const editor of ['joe', 'gvim']) {
      test(`${editor} uses +line`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), ['+10', 'file'])
      })
    }

    for (const editor of ['emacs', 'emacsclient']) {
      test(`${editor} uses +line:column`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), ['+10:5', 'file'])
      })
    }

    for (const editor of ['rmate', 'mate', 'mine']) {
      test(`${editor} uses --line`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), ['--line', 10, 'file'])
      })
    }

    for (const editor of [
      'code',
      'Code',
      'code-insiders',
      'Code - Insiders',
      'codium',
      'trae',
      'antigravity',
      'cursor',
      'vscodium',
      'VSCodium',
    ]) {
      test(`${editor} uses -r -g "file:line:column"`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), ['-r', '-g', 'file:10:5'])
      })
    }

    for (const editor of ['idea', 'idea64', 'webstorm', 'pycharm', 'clion', 'rider']) {
      test(`${editor} uses --line/--column`, () => {
        assert.deepEqual(getArgumentsForFile(editor, 'file', 10, 5), [
          '--line',
          10,
          '--column',
          5,
          'file',
        ])
      })
    }
  })

  test('defaults columnNumber to 1 when omitted', () => {
    assert.deepEqual(getArgumentsForFile('code', 'file', 10), ['-r', '-g', 'file:10:1'])
  })

  describe('editor resolution via path.basename and extension stripping', () => {
    test('resolves a full POSIX path', () => {
      assert.deepEqual(getArgumentsForFile('/usr/local/bin/code', 'file', 10, 5), [
        '-r',
        '-g',
        'file:10:5',
      ])
    })

    if (process.platform === 'win32') {
      test('resolves a full Windows path with .exe', () => {
        assert.deepEqual(getArgumentsForFile('C:\\path\\Code.exe', 'file', 10, 5), [
          '-r',
          '-g',
          'file:10:5',
        ])
      })

      test('resolves notepad++ from a full path with .exe', () => {
        assert.deepEqual(getArgumentsForFile('C:\\tools\\notepad++.exe', 'file', 10, 5), [
          '-n10',
          '-c5',
          'file',
        ])
      })
    }

    test('strips .cmd extension case-insensitively', () => {
      assert.deepEqual(getArgumentsForFile('code.CMD', 'file', 10, 5), ['-r', '-g', 'file:10:5'])
    })
  })
})
