import { describe, expect, test } from 'vitest'

import {
  getEditorFromMacProcesses,
  getEditorFromWindowsProcesses,
  getEditorFromLinuxProcesses,
} from './guess.js'

describe('getEditorFromMacProcesses', () => {
  test('maps an exact process path to its CLI command', () => {
    const output = [
      '/sbin/launchd',
      '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
      '/usr/sbin/cfprefsd',
    ].join('\n')
    expect(getEditorFromMacProcesses(output)).toBe('code')
  })

  test('uses the CLI command for an install outside /Applications', () => {
    // `Atom` maps to the short command `atom`, so even when running from a
    // custom location we should return that command.
    const output = ['/sbin/launchd', '/Users/me/dev/Atom.app/Contents/MacOS/Atom'].join('\n')
    expect(getEditorFromMacProcesses(output)).toBe('atom')
  })

  test('returns the running process path when the map points at itself', () => {
    // `CLion` maps to its own full path, so for an install outside
    // /Applications we should return the actual running path.
    const runningPath = '/Users/me/dev/CLion.app/Contents/MacOS/clion'
    const output = ['/sbin/launchd', runningPath].join('\n')
    expect(getEditorFromMacProcesses(output)).toBe(runningPath)
  })

  test('returns undefined when no editor is running', () => {
    const output = ['/sbin/launchd', '/usr/sbin/cfprefsd'].join('\n')
    expect(getEditorFromMacProcesses(output)).toBeUndefined()
  })
})

describe('getEditorFromWindowsProcesses', () => {
  test('returns the full executable path of a known editor', () => {
    const codePath = 'C:\\Program Files\\Microsoft VS Code\\Code.exe'
    const output = ['C:\\Windows\\System32\\svchost.exe', codePath].join('\r\n')
    expect(getEditorFromWindowsProcesses(output)).toBe(codePath)
  })

  test('returns undefined when no editor is running', () => {
    const output = ['C:\\Windows\\System32\\svchost.exe', 'C:\\Windows\\explorer.exe'].join('\r\n')
    expect(getEditorFromWindowsProcesses(output)).toBeUndefined()
  })
})

describe('getEditorFromLinuxProcesses', () => {
  test('maps a process name to its CLI command', () => {
    const output = ['systemd', 'code', 'bash'].join('\n')
    expect(getEditorFromLinuxProcesses(output)).toBe('code')
  })

  test('maps sublime_text to subl', () => {
    const output = ['systemd', 'sublime_text'].join('\n')
    expect(getEditorFromLinuxProcesses(output)).toBe('subl')
  })

  test('matches code-insiders before code due to key order', () => {
    const output = ['systemd', 'code-insiders'].join('\n')
    expect(getEditorFromLinuxProcesses(output)).toBe('code-insiders')
  })

  test('returns undefined when no editor is running', () => {
    const output = ['systemd', 'bash', 'sshd'].join('\n')
    expect(getEditorFromLinuxProcesses(output)).toBeUndefined()
  })
})
