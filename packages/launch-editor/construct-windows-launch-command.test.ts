import { describe, expect, test } from 'vitest'

import constructWindowsLaunchCommand from './construct-windows-launch-command.ts'

describe('constructWindowsLaunchCommand', () => {
  test('joins the editor and arguments', () => {
    expect(constructWindowsLaunchCommand('code', ['--reuse-window', 'C:\\project\\file.js'])).toBe(
      'code --reuse-window C:\\project\\file.js',
    )
  })

  test('quotes an editor path and arguments containing spaces', () => {
    expect(
      constructWindowsLaunchCommand('C:\\Program Files\\Microsoft VS Code\\Code.exe', [
        '--reuse-window',
        'C:\\my project\\file.js',
      ]),
    ).toBe(
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
      expect(constructWindowsLaunchCommand('code', [fileName])).toBe(`code ${fileName}`)
    })
  }

  test('escapes CMD metacharacters in arguments', () => {
    expect(constructWindowsLaunchCommand('code', ['C:\\project\\&|<>,;=^file.js'])).toBe(
      'code ^"C:\\project\\^&^|^<^>^,^;^=^^file.js^"',
    )
  })

  for (const [name, lineBreak] of [
    ['carriage returns', '\r'],
    ['line feeds', '\n'],
  ]) {
    test(`rejects ${name} in arguments`, () => {
      expect(() =>
        constructWindowsLaunchCommand('code', [`C:\\project\\file.js${lineBreak}calc.exe`]),
      ).toThrow(/argument containing a line break/)
    })
  }

  test('rejects percent signs in arguments', () => {
    expect(() => constructWindowsLaunchCommand('code', ['C:\\project\\100%\\file.js'])).toThrow(
      /argument containing "%"/,
    )
  })

  test('rejects CMD variable modifiers', () => {
    expect(() => constructWindowsLaunchCommand('code', ['C:\\project\\%VAR:old=new%'])).toThrow(
      /argument containing "%"/,
    )
  })

  test('quotes arguments containing both spaces and escaped CMD metacharacters', () => {
    expect(constructWindowsLaunchCommand('code', ['C:\\my project\\&file.js'])).toBe(
      'code ^"C:\\my project\\^&file.js^"',
    )
  })
})
