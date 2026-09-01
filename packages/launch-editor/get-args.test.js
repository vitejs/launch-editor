const assert = require('node:assert/strict')
const os = require('node:os')
const path = require('node:path')
const { describe, test } = require('node:test')

const getArgumentsForFile = require('./get-args.js')
const absoluteFileName = path.resolve('file')

describe('getArgumentsForFile', () => {
  test('uses an absolute file name as the only argument when no position is given', () => {
    assert.deepEqual(getArgumentsForFile('vim', absoluteFileName), [absoluteFileName])
  })

  test('resolves a relative file name to an absolute path', () => {
    assert.deepEqual(getArgumentsForFile('vim', 'file'), [absoluteFileName])
  })

  describe('WSL handling', () => {
    if (process.platform !== 'linux') {
      return
    }

    test('uses a relative path for files on a Windows drive in WSL', (t) => {
      t.mock.method(process, 'cwd', () => '/home/user/project')
      t.mock.method(os, 'release', () => '4.4.0-43-Microsoft')

      const fileName = '/mnt/c/project/file.js'
      assert.deepEqual(getArgumentsForFile('vim', fileName), ['./../../../mnt/c/project/file.js'])
    })

    test('resolves a relative path before converting it for WSL', (t) => {
      t.mock.method(process, 'cwd', () => '/mnt/c/project')
      t.mock.method(os, 'release', () => '4.4.0-43-Microsoft')

      assert.deepEqual(getArgumentsForFile('vim', 'file.js'), ['./file.js'])
    })

    test('prefixes an option-like relative path on a Windows drive in WSL', (t) => {
      t.mock.method(process, 'cwd', () => '/mnt/c/project')
      t.mock.method(os, 'release', () => '4.4.0-43-Microsoft')

      const fileName = '+call system("touch LAUNCH_EDITOR_MARKER")'
      assert.deepEqual(getArgumentsForFile('vim', fileName), [
        './+call system("touch LAUNCH_EDITOR_MARKER")',
      ])
    })
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
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          `${absoluteFileName}:10:5`,
        ])
      })
    }

    test('notepad++ uses -n/-c flags', () => {
      assert.deepEqual(getArgumentsForFile('notepad++', absoluteFileName, 10, 5), [
        '-n10',
        '-c5',
        absoluteFileName,
      ])
    })

    for (const editor of ['vim', 'mvim']) {
      test(`${editor} uses +call cursor()`, () => {
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '+call cursor(10, 5)',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['joe', 'gvim']) {
      test(`${editor} uses +line`, () => {
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '+10',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['emacs', 'emacsclient']) {
      test(`${editor} uses +line:column`, () => {
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '+10:5',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['rmate', 'mate', 'mine']) {
      test(`${editor} uses --line`, () => {
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '--line',
          10,
          absoluteFileName,
        ])
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
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '-r',
          '-g',
          `${absoluteFileName}:10:5`,
        ])
      })
    }

    for (const editor of ['idea', 'idea64', 'webstorm', 'pycharm', 'clion', 'rider']) {
      test(`${editor} uses --line/--column`, () => {
        assert.deepEqual(getArgumentsForFile(editor, absoluteFileName, 10, 5), [
          '--line',
          10,
          '--column',
          5,
          absoluteFileName,
        ])
      })
    }
  })

  test('defaults columnNumber to 1 when omitted', () => {
    assert.deepEqual(getArgumentsForFile('code', absoluteFileName, 10), [
      '-r',
      '-g',
      `${absoluteFileName}:10:1`,
    ])
  })

  describe('editor resolution via path.basename and extension stripping', () => {
    test('resolves a full POSIX path', () => {
      assert.deepEqual(getArgumentsForFile('/usr/local/bin/code', absoluteFileName, 10, 5), [
        '-r',
        '-g',
        `${absoluteFileName}:10:5`,
      ])
    })

    if (process.platform === 'win32') {
      test('resolves a full Windows path with .exe', () => {
        assert.deepEqual(getArgumentsForFile('C:\\path\\Code.exe', absoluteFileName, 10, 5), [
          '-r',
          '-g',
          `${absoluteFileName}:10:5`,
        ])
      })

      test('resolves notepad++ from a full path with .exe', () => {
        assert.deepEqual(getArgumentsForFile('C:\\tools\\notepad++.exe', absoluteFileName, 10, 5), [
          '-n10',
          '-c5',
          absoluteFileName,
        ])
      })
    }

    test('strips .cmd extension case-insensitively', () => {
      assert.deepEqual(getArgumentsForFile('code.CMD', absoluteFileName, 10, 5), [
        '-r',
        '-g',
        `${absoluteFileName}:10:5`,
      ])
    })
  })

  describe('file names that look like editor options', () => {
    const cases = [
      ['vim', '+call writefile(["marker"], "LAUNCH_EDITOR_MARKER")|qa!'],
      ['mvim', '-ccall writefile(["marker"], "LAUNCH_EDITOR_MARKER")|qa!'],
      ['gvim', '+call writefile(["marker"], "LAUNCH_EDITOR_MARKER")|qa!'],
      ['emacs', '--eval=(write-region "marker" nil "LAUNCH_EDITOR_MARKER")'],
      ['emacsclient', '-eatouch LAUNCH_EDITOR_MARKER'],
      ['notepad++', '-pluginMessage=LAUNCH_EDITOR_MARKER'],
    ]

    for (const [editor, fileName] of cases) {
      for (const lineNumber of [undefined, 10]) {
        const position = lineNumber ? 'with a position' : 'without a position'

        test(`${editor} protects an option-like file name ${position}`, () => {
          const args = getArgumentsForFile(editor, fileName, lineNumber, 5)
          const fileArgument = args.at(-1)

          assert.equal(path.resolve(fileArgument), path.resolve(fileName))
          assert.ok(
            path.isAbsolute(fileArgument),
            `unsafe editor arguments: ${JSON.stringify(args)}`,
          )
        })
      }
    }
  })
})
