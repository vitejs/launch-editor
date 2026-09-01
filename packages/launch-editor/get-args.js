const os = require('os')
const path = require('path')

// normalize a file and optional line/column numbers into command line args for specific editors
module.exports = function getArgumentsForFile(editor, fileName, lineNumber, columnNumber = 1) {
  if (
    process.platform === 'linux' &&
    fileName.startsWith('/mnt/') &&
    /Microsoft/i.test(os.release())
  ) {
    // Assume WSL / "Bash on Ubuntu on Windows" is being used, and
    // that the file exists on the Windows file system.
    // `os.release()` is "4.4.0-43-Microsoft" in the current release
    // build of WSL, see: https://github.com/Microsoft/BashOnWindows/issues/423#issuecomment-221627364
    // When a Windows editor is specified, interop functionality can
    // handle the path translation, but only if a relative path is used.
    fileName = path.relative('', fileName)
  }

  if (!lineNumber) {
    return [fileName]
  }

  const editorBasename = path.basename(editor).replace(/\.(exe|cmd|bat)$/i, '')
  switch (editorBasename) {
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'sublime_text':
    case 'wstorm':
    case 'charm':
    case 'zed':
      return [`${fileName}:${lineNumber}:${columnNumber}`]
    case 'notepad++':
      return ['-n' + lineNumber, '-c' + columnNumber, fileName]
    case 'vim':
    case 'mvim':
      return [`+call cursor(${lineNumber}, ${columnNumber})`, fileName]
    case 'joe':
    case 'gvim':
      return [`+${lineNumber}`, fileName]
    case 'emacs':
    case 'emacsclient':
      return [`+${lineNumber}:${columnNumber}`, fileName]
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', lineNumber, fileName]
    case 'code':
    case 'Code':
    case 'code-insiders':
    case 'Code - Insiders':
    case 'codium':
    case 'trae':
    case 'antigravity':
    case 'cursor':
    case 'vscodium':
    case 'VSCodium':
      return ['-r', '-g', `${fileName}:${lineNumber}:${columnNumber}`]
    case 'appcode':
    case 'clion':
    case 'clion64':
    case 'idea':
    case 'idea64':
    case 'phpstorm':
    case 'phpstorm64':
    case 'pycharm':
    case 'pycharm64':
    case 'rubymine':
    case 'rubymine64':
    case 'webstorm':
    case 'webstorm64':
    case 'goland':
    case 'goland64':
    case 'rider':
    case 'rider64':
      return ['--line', lineNumber, '--column', columnNumber, fileName]
  }

  if (process.env.LAUNCH_EDITOR) {
    return [fileName, lineNumber, columnNumber]
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return [fileName]
}
