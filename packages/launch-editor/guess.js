import path from 'node:path'
import shellQuote from 'shell-quote'
import childProcess from 'node:child_process'

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
import COMMON_EDITORS_MACOS from './editor-info/macos.js'
import COMMON_EDITORS_LINUX from './editor-info/linux.js'
import COMMON_EDITORS_WIN from './editor-info/windows.js'

function getEditorFromMacProcesses(output) {
  const processList = output.split('\n')
  for (const [processName, editor] of Object.entries(COMMON_EDITORS_MACOS)) {
    // Find editor by exact match.
    if (processList.includes(processName)) {
      return editor
    }
    const processNameWithoutApplications = processName.replace('/Applications', '')
    // Find editor installation not in /Applications.
    if (output.includes(processNameWithoutApplications)) {
      // Use the CLI command if one is specified
      if (processName !== editor) {
        return editor
      }
      // Use a partial match to find the running process path.  If one is found, use the
      // existing path since it can be running from anywhere.
      const runningProcess = processList.find((procName) =>
        procName.endsWith(processNameWithoutApplications),
      )
      if (runningProcess !== undefined) {
        return runningProcess
      }
    }
  }
  return undefined
}

function getEditorFromWindowsProcesses(output) {
  const runningProcesses = output.split('\r\n')
  for (const runningProcess of runningProcesses) {
    const fullProcessPath = runningProcess.trim()
    const shortProcessName = path.win32.basename(fullProcessPath)

    if (COMMON_EDITORS_WIN.includes(shortProcessName)) {
      return fullProcessPath
    }
  }
  return undefined
}

function getEditorFromLinuxProcesses(output) {
  for (const [processName, editor] of Object.entries(COMMON_EDITORS_LINUX)) {
    if (output.includes(processName)) {
      return editor
    }
  }
  return undefined
}

function guessEditor(specifiedEditor) {
  if (specifiedEditor) {
    return shellQuote.parse(specifiedEditor)
  }

  if (process.env.LAUNCH_EDITOR) {
    return [process.env.LAUNCH_EDITOR]
  }

  if (process.versions.webcontainer) {
    return [process.env.EDITOR || 'code']
  }

  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  try {
    if (process.platform === 'darwin') {
      const output = childProcess.execSync('ps x -o comm=', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      })
      const editor = getEditorFromMacProcesses(output)
      if (editor !== undefined) {
        return [editor]
      }
    } else if (process.platform === 'win32') {
      const output = childProcess.execSync(
        'powershell -NoProfile -Command "' +
          '[Console]::OutputEncoding=[Text.Encoding]::UTF8;' +
          'Get-CimInstance -Query \\"select executablepath from win32_process where executablepath is not null\\" | % { $_.ExecutablePath }' +
          '"',
        {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        },
      )
      const editor = getEditorFromWindowsProcesses(output)
      if (editor !== undefined) {
        return [editor]
      }
    } else if (process.platform === 'linux') {
      // --no-heading No header line
      // x List all processes owned by you
      // -o comm Need only names column
      const output = childProcess.execSync('ps x --no-heading -o comm --sort=comm', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      })
      const editor = getEditorFromLinuxProcesses(output)
      if (editor !== undefined) {
        return [editor]
      }
    }
  } catch (ignoreError) {
    // Ignore...
  }

  // Last resort, use old skool env vars
  if (process.env.VISUAL) {
    return [process.env.VISUAL]
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR]
  }

  return [null]
}

export default guessEditor
export { getEditorFromMacProcesses, getEditorFromWindowsProcesses, getEditorFromLinuxProcesses }
