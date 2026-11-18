const assert = require('node:assert/strict')
const { describe, test } = require('node:test')

const guessEditor = require('./guess.js')
const { getEditorFromMacProcesses, getEditorFromWindowsProcesses, getEditorFromLinuxProcesses } =
  guessEditor

describe('getEditorFromMacProcesses', () => {
  test('maps an exact process path to its CLI command', () => {
    const output = [
      '/sbin/launchd',
      '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
      '/usr/sbin/cfprefsd',
    ].join('\n')
    assert.equal(getEditorFromMacProcesses(output), 'code')
  })

  test('uses the CLI command for an install outside /Applications', () => {
    // `Atom` maps to the short command `atom`, so even when running from a
    // custom location we should return that command.
    const output = ['/sbin/launchd', '/Users/me/dev/Atom.app/Contents/MacOS/Atom'].join('\n')
    assert.equal(getEditorFromMacProcesses(output), 'atom')
  })

  test('returns the running process path when the map points at itself', () => {
    // `CLion` maps to its own full path, so for an install outside
    // /Applications we should return the actual running path.
    const runningPath = '/Users/me/dev/CLion.app/Contents/MacOS/clion'
    const output = ['/sbin/launchd', runningPath].join('\n')
    assert.equal(getEditorFromMacProcesses(output), runningPath)
  })

  test('returns undefined when no editor is running', () => {
    const output = ['/sbin/launchd', '/usr/sbin/cfprefsd'].join('\n')
    assert.equal(getEditorFromMacProcesses(output), undefined)
  })
})

describe('getEditorFromWindowsProcesses', () => {
  test('returns the full executable path of a known editor', () => {
    const codePath = 'C:\\Program Files\\Microsoft VS Code\\Code.exe'
    const output = ['C:\\Windows\\System32\\svchost.exe', codePath].join('\r\n')
    assert.equal(getEditorFromWindowsProcesses(output), codePath)
  })

  test('returns undefined when no editor is running', () => {
    const output = ['C:\\Windows\\System32\\svchost.exe', 'C:\\Windows\\explorer.exe'].join('\r\n')
    assert.equal(getEditorFromWindowsProcesses(output), undefined)
  })
})

describe('getEditorFromLinuxProcesses', () => {
  test('maps a process name to its CLI command', () => {
    const output = ['systemd', 'code', 'bash'].join('\n')
    assert.equal(getEditorFromLinuxProcesses(output), 'code')
  })

  test('maps sublime_text to subl', () => {
    const output = ['systemd', 'sublime_text'].join('\n')
    assert.equal(getEditorFromLinuxProcesses(output), 'subl')
  })

  test('uses zeditor when a distro renamed the zed CLI', () => {
    const output = ['systemd', 'zed', 'bash'].join('\n')
    const isExecutable = (command) => command === 'zeditor'
    assert.equal(getEditorFromLinuxProcesses(output, isExecutable), 'zeditor')
  })

  test('uses zedit when only that rename exists', () => {
    const output = ['systemd', 'zed'].join('\n')
    const isExecutable = (command) => command === 'zedit'
    assert.equal(getEditorFromLinuxProcesses(output, isExecutable), 'zedit')
  })

  test('falls back to zed when no renamed CLI exists', () => {
    const output = ['systemd', 'zed'].join('\n')
    assert.equal(
      getEditorFromLinuxProcesses(output, () => false),
      'zed',
    )
  })

  test('does not look up the command for a single-command mapping', () => {
    const output = ['systemd', 'code'].join('\n')
    const isExecutable = () => assert.fail('should not be called')
    assert.equal(getEditorFromLinuxProcesses(output, isExecutable), 'code')
  })

  test('matches code-insiders before code due to key order', () => {
    const output = ['systemd', 'code-insiders'].join('\n')
    assert.equal(getEditorFromLinuxProcesses(output), 'code-insiders')
  })

  test('returns undefined when no editor is running', () => {
    const output = ['systemd', 'bash', 'sshd'].join('\n')
    assert.equal(getEditorFromLinuxProcesses(output), undefined)
  })
})
