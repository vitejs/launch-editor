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
import childProcess from 'node:child_process'

import guessEditor from './guess.js'
import getArgumentsForFile from './get-args.js'
import constructWindowsLaunchCommand from './construct-windows-launch-command.js'
import parseFile from './parse-file.js'

function wrapErrorCallback(cb) {
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

function isTerminalEditor(editor) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true
  }
  return false
}

let currentChildProcess = null

function launchEditor(file, specifiedEditor, onErrorCallback) {
  const { fileName, lineNumber, columnNumber } = parseFile(file)

  if (typeof specifiedEditor === 'function') {
    onErrorCallback = specifiedEditor
    specifiedEditor = undefined
  }

  onErrorCallback = wrapErrorCallback(onErrorCallback)

  if (process.platform === 'win32' && fileName.startsWith('\\\\')) {
    return onErrorCallback(
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
    onErrorCallback(fileName, null)
    return
  }

  const extraArgs = getArgumentsForFile(editor, fileName, lineNumber, columnNumber)
  args.push(...extraArgs)

  let launchCommand
  if (process.platform === 'win32') {
    try {
      launchCommand = constructWindowsLaunchCommand(editor, args)
    } catch (error) {
      onErrorCallback(fileName, error.message)
      return
    }
  }

  if (currentChildProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    currentChildProcess.kill('SIGKILL')
  }

  if (process.platform === 'win32') {
    currentChildProcess = childProcess.exec(launchCommand, {
      stdio: 'inherit',
      shell: true,
    })
  } else {
    currentChildProcess = childProcess.spawn(editor, args, { stdio: 'inherit' })
  }
  currentChildProcess.on('exit', function (errorCode) {
    currentChildProcess = null

    if (errorCode) {
      onErrorCallback(fileName, '(code ' + errorCode + ')')
    }
  })

  currentChildProcess.on('error', function (error) {
    let { code, message } = error
    if ('ENOENT' === code) {
      message = `${message} ('${editor}' command does not exist in 'PATH')`
    }
    onErrorCallback(fileName, message)
  })
}

export default launchEditor
