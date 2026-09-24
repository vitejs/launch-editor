const assert = require('node:assert/strict')
const { describe, test } = require('node:test')

const constructWindowsLaunchCommand = require('./construct-windows-launch-command.js')

describe('constructWindowsLaunchCommand', () => {
  test('joins the editor and arguments', () => {
    assert.equal(
      constructWindowsLaunchCommand('code', ['--reuse-window', 'C:\\project\\file.js']),
      'code --reuse-window C:\\project\\file.js',
    )
  })

  test('quotes an editor path and arguments containing spaces', () => {
    assert.equal(
      constructWindowsLaunchCommand('C:\\Program Files\\Microsoft VS Code\\Code.exe', [
        '--reuse-window',
        'C:\\my project\\file.js',
      ]),
      '"C:\\Program Files\\Microsoft VS Code\\Code.exe" --reuse-window "C:\\my project\\file.js"',
    )
  })

  for (const [useCase, fileName] of [
    ['SvelteKit and Vike `+` routes', '+page.svelte'],
    ['Remix `$` routes', '$route.tsx'],
    ['Analog, SolidStart, and Vike route groups', '(group)\\page.tsx'],
    ['Vike `@` routes', '@route\\page.tsx'],
    ['square-bracket route parameters', '[slug]\\page.tsx'],
  ]) {
    test(`supports ${useCase}`, () => {
      assert.equal(constructWindowsLaunchCommand('code', [fileName]), `code ${fileName}`)
    })
  }

  test('escapes CMD metacharacters in arguments', () => {
    assert.equal(
      constructWindowsLaunchCommand('code', ['C:\\project\\&|<>,;=^%file.js']),
      'code ^"C:\\project\\^&^|^<^>^,^;^=^^^%file.js^"',
    )
  })

  test('escapes every percent sign in arguments', () => {
    assert.equal(
      constructWindowsLaunchCommand('code', ['C:\\%TEMP%\\file.js']),
      'code ^"C:\\^%TEMP^%\\file.js^"',
    )
  })

  test('rejects percent signs when an environment variable name contains a caret', (t) => {
    const environmentVariable = 'LAUNCH_EDITOR_TEST^'
    process.env[environmentVariable] = 'value'
    t.after(() => delete process.env[environmentVariable])

    assert.throws(
      () => constructWindowsLaunchCommand('code', ['C:\\project\\100%\\file.js']),
      /argument containing "%" when an environment variable name contains "\^"/,
    )
  })

  test('quotes arguments containing both spaces and escaped CMD metacharacters', () => {
    assert.equal(
      constructWindowsLaunchCommand('code', ['C:\\my project\\&file.js']),
      'code ^"C:\\my project\\^&file.js^"',
    )
  })
})
