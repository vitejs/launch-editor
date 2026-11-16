/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/facebookincubator/create-react-app/blob/master/LICENSE
 *
 * Modified by Yuxi Evan You
 */

import fs from 'node:fs'
import path from 'node:path'
import colors from 'picocolors'
import childProcess, { type ChildProcess } from 'node:child_process'

import guessEditor from './guess.ts'
import getArgumentsForFile from './get-args.ts'
import constructWindowsLaunchCommand from './construct-windows-launch-command.ts'
import parseFile from './parse-file.ts'

type ErrorCallback = (fileName: string, errorMessage: string | null) => void

function wrapErrorCallback(cb?: ErrorCallback): ErrorCallback {
  return (fileName, errorMessage) => {
    console.log()
    console.log(colors.red('Could not open ' + path.basename(fileName) + ' in the editor.'))
    if (errorMessage) {
      if (errorMessage[errorMessage.length - 1] !== '.') {
        errorMessage += '.'
      }
      console.log(colors.red('The editor process exited with an error: ' + errorMessage))
    }
    console.log()
    if (cb) cb(fileName, errorMessage)
  }
}

function isTerminalEditor(editor: string) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true
  }
  return false
}

let currentChildProcess: ChildProcess | null = null

/**
 * Launch an editor to open a file at a specific line and column.
 *
 * @param file File path with optional line and column numbers (e.g.
 *   "/path/to/file.js:10:2").
 * @param onErrorCallback Optional callback for handling errors.
 */
function launchEditor(file: string, onErrorCallback?: ErrorCallback): void

/**
 * Launch an editor to open a file at a specific line and column.
 *
 * @param file File path with optional line and column numbers (e.g.
 *   "/path/to/file.js:10:2").
 * @param specifiedEditor Optional editor command or path to use. Will be
 *   parsed using `shell-quote`.
 * @param onErrorCallback Optional callback for handling errors.
 */
function launchEditor(file: string, specifiedEditor?: string, onErrorCallback?: ErrorCallback): void
function launchEditor(
  file: string,
  specifiedEditor?: string | ErrorCallback,
  onErrorCallback?: ErrorCallback,
): void {
  const { fileName, lineNumber, columnNumber } = parseFile(file)

  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  const onError = wrapErrorCallback(onErrorCallback)

  if (process.platform === 'win32' && fileName.startsWith('\\\\')) {
    return onError(
      fileName,
      'UNC paths are not supported on Windows to avoid security issues. ' +
        'See https://github.com/vitejs/launch-editor/tree/main/packages/launch-editor#unc-paths-on-windows for details.',
    )
  }

  if (!fs.existsSync(fileName)) {
    return
  }

  const [editor, ...args] = guessEditor(specifiedEditor)
  if (!editor) {
    onError(fileName, null)
    return
  }

  const extraArgs = getArgumentsForFile(
    editor,
    fileName,
    lineNumber,
    columnNumber ?? undefined,
  ).map(String)
  args.push(...extraArgs)

  let launchCommand: string | undefined
  if (process.platform === 'win32') {
    try {
      launchCommand = constructWindowsLaunchCommand(editor, args)
    } catch (error) {
      onError(fileName, (error as Error).message)
      return
    }
  }

  if (currentChildProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    currentChildProcess.kill('SIGKILL')
  }

  if (launchCommand !== undefined) {
    currentChildProcess = childProcess.exec(launchCommand)
  } else {
    currentChildProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
  currentChildProcess.on('exit', function (errorCode) {
    currentChildProcess = null

    if (errorCode) {
      onError(fileName, '(code ' + errorCode + ')')
    }
  })

  currentChildProcess.on('error', function (error: NodeJS.ErrnoException) {
    let { code, message } = error
    if ('ENOENT' === code) {
      message = `${message} ('${editor}' command does not exist in 'PATH')`
    }
    onError(fileName, message)
  })
}

export default launchEditor
