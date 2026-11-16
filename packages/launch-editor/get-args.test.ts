import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import getArgumentsForFile from './get-args.ts'
const absoluteFileName = path.resolve('file')

describe('getArgumentsForFile', () => {
  test('uses an absolute file name as the only argument when no position is given', () => {
    expect(getArgumentsForFile('vim', absoluteFileName)).toStrictEqual([absoluteFileName])
  })

  test('resolves a relative file name to an absolute path', () => {
    expect(getArgumentsForFile('vim', 'file')).toStrictEqual([absoluteFileName])
  })

  describe.skipIf(process.platform !== 'linux')('WSL handling', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('uses a relative path for files on a Windows drive in WSL', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/home/user/project')
      vi.spyOn(os, 'release').mockReturnValue('4.4.0-43-Microsoft')

      const fileName = '/mnt/c/project/file.js'
      expect(getArgumentsForFile('vim', fileName)).toStrictEqual([
        './../../../mnt/c/project/file.js',
      ])
    })

    test('resolves a relative path before converting it for WSL', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/mnt/c/project')
      vi.spyOn(os, 'release').mockReturnValue('4.4.0-43-Microsoft')

      expect(getArgumentsForFile('vim', 'file.js')).toStrictEqual(['./file.js'])
    })

    test('prefixes an option-like relative path on a Windows drive in WSL', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/mnt/c/project')
      vi.spyOn(os, 'release').mockReturnValue('4.4.0-43-Microsoft')

      const fileName = '+call system("touch LAUNCH_EDITOR_MARKER")'
      expect(getArgumentsForFile('vim', fileName)).toStrictEqual([
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
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
          `${absoluteFileName}:10:5`,
        ])
      })
    }

    test('notepad++ uses -n/-c flags', () => {
      expect(getArgumentsForFile('notepad++', absoluteFileName, 10, 5)).toStrictEqual([
        '-n10',
        '-c5',
        absoluteFileName,
      ])
    })

    for (const editor of ['vim', 'mvim']) {
      test(`${editor} uses +call cursor()`, () => {
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
          '+call cursor(10, 5)',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['joe', 'gvim']) {
      test(`${editor} uses +line`, () => {
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
          '+10',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['emacs', 'emacsclient']) {
      test(`${editor} uses +line:column`, () => {
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
          '+10:5',
          absoluteFileName,
        ])
      })
    }

    for (const editor of ['rmate', 'mate', 'mine']) {
      test(`${editor} uses --line`, () => {
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
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
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
          '-r',
          '-g',
          `${absoluteFileName}:10:5`,
        ])
      })
    }

    for (const editor of ['idea', 'idea64', 'webstorm', 'pycharm', 'clion', 'rider']) {
      test(`${editor} uses --line/--column`, () => {
        expect(getArgumentsForFile(editor, absoluteFileName, 10, 5)).toStrictEqual([
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
    expect(getArgumentsForFile('code', absoluteFileName, 10)).toStrictEqual([
      '-r',
      '-g',
      `${absoluteFileName}:10:1`,
    ])
  })

  describe('editor resolution via path.basename and extension stripping', () => {
    test('resolves a full POSIX path', () => {
      expect(getArgumentsForFile('/usr/local/bin/code', absoluteFileName, 10, 5)).toStrictEqual([
        '-r',
        '-g',
        `${absoluteFileName}:10:5`,
      ])
    })

    if (process.platform === 'win32') {
      test('resolves a full Windows path with .exe', () => {
        expect(getArgumentsForFile('C:\\path\\Code.exe', absoluteFileName, 10, 5)).toStrictEqual([
          '-r',
          '-g',
          `${absoluteFileName}:10:5`,
        ])
      })

      test('resolves notepad++ from a full path with .exe', () => {
        expect(
          getArgumentsForFile('C:\\tools\\notepad++.exe', absoluteFileName, 10, 5),
        ).toStrictEqual(['-n10', '-c5', absoluteFileName])
      })
    }

    test('strips .cmd extension case-insensitively', () => {
      expect(getArgumentsForFile('code.CMD', absoluteFileName, 10, 5)).toStrictEqual([
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
          const fileArgument = args.at(-1) as string

          expect(path.resolve(fileArgument)).toBe(path.resolve(fileName))
          expect(
            path.isAbsolute(fileArgument),
            `unsafe editor arguments: ${JSON.stringify(args)}`,
          ).toBe(true)
        })
      }
    }
  })
})
