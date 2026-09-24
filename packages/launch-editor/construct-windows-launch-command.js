// On Windows, we need to use `exec` with the `shell: true` option,
// and some more sanitization is required.

// However, CMD.exe on Windows is vulnerable to RCE attacks given a file name of the
// form "C:\Users\myusername\Downloads\& curl 172.21.93.52".
// `create-react-app` used a safe file name pattern to validate user-provided file names:
// - https://github.com/facebook/create-react-app/pull/4866
// - https://github.com/facebook/create-react-app/pull/5431
// But that's not a viable solution for this package because
// it's depended on by so many meta frameworks that heavily rely on
// special characters in file names for filesystem-based routing.
// We need to at least:
// - Support `+` because it's used in SvelteKit and Vike
// - Support `$` because it's used in Remix
// - Support `(` and `)` because they are used in Analog, SolidStart, and Vike
// - Support `@` because it's used in Vike
// - Support `[` and `]` because they are widely used for [slug]
// So here we choose to use `^` to escape special characters instead.

// According to https://ss64.com/nt/syntax-esc.html,
// we can use `^` to escape `&`, `<`, `>`, `|`, `%`, and `^`
// I'm not sure if we have to escape all of these, but let's do it anyway
function escapeCmdArgs(cmdArgs) {
  return cmdArgs.replace(/([&|<>,;=^%])/g, '^$1')
}

// Need to double quote the editor path in case it contains spaces;
// If the fileName contains spaces, we also need to double quote it in the arguments
// However, there's a case that it's concatenated with line number and column number
// which is separated by `:`. We need to double quote the whole string in this case.
// Also, if the string contains the escape character `^`, it needs to be quoted, too.
function doubleQuoteIfNeeded(str) {
  if (str.includes('^')) {
    // If a string includes an escaped character, not only does it need to be quoted,
    // but the quotes need to be escaped too.
    return `^"${str}^"`
  } else if (str.includes(' ')) {
    return `"${str}"`
  }
  return str
}

function constructWindowsLaunchCommand(editor, args) {
  // `%` is valid in Windows file names, so rejecting it unconditionally would break
  // legitimate paths. Escaping `%NAME%` produces `^%NAME^%`, but CMD expands environment
  // variables before consuming caret escapes. A matching `NAME^` variable could therefore
  // reintroduce command syntax, so reject only when both conditions make expansion possible.
  const hasCaretEnvironmentVariable = Object.keys(process.env).some((name) => name.includes('^'))
  if (hasCaretEnvironmentVariable && args.some((arg) => arg.includes('%'))) {
    throw new Error(
      'Cannot launch an editor with an argument containing "%" when an environment variable name contains "^"',
    )
  }

  return [editor, ...args.map(escapeCmdArgs)].map(doubleQuoteIfNeeded).join(' ')
}

module.exports = constructWindowsLaunchCommand
