import { describe, expect, test, vi } from 'vitest'

import launchEditor from './dist/index.js'

const UNC_ERROR = 'UNC paths are not supported on Windows to avoid security issues.'

describe('launchEditor UNC path guard', () => {
  if (process.platform === 'win32') {
    test('rejects UNC paths on Windows via the error callback', () => {
      const onError = vi.fn<(fileName: string, errorMessage: string | null) => void>()

      launchEditor('\\\\server\\share\\file.js', 'vim', onError)

      expect(onError).toHaveBeenCalledOnce()
      const [fileName, message] = onError.mock.calls[0]
      expect(fileName).toBe('\\\\server\\share\\file.js')
      expect(message).toContain(UNC_ERROR)
    })

    test('strips the position suffix before reporting the rejected UNC path', () => {
      const onError = vi.fn<(fileName: string, errorMessage: string | null) => void>()

      launchEditor('\\\\server\\share\\file.js:10:5', 'vim', onError)

      expect(onError).toHaveBeenCalledOnce()
      const [fileName, message] = onError.mock.calls[0]
      expect(fileName).toBe('\\\\server\\share\\file.js')
      expect(message).toContain(UNC_ERROR)
    })

    test('does not treat a normal absolute Windows path as UNC', () => {
      const onError = vi.fn()

      // Non-existent file: without the UNC guard firing, launchEditor returns
      // silently at the `fs.existsSync` check without invoking the callback.
      launchEditor('C:\\Users\\me\\does-not-exist-xyz.js', 'vim', onError)

      expect(onError).not.toHaveBeenCalled()
    })
  } else {
    test('does not apply the UNC guard on non-Windows platforms', () => {
      const onError = vi.fn()

      launchEditor('\\\\server\\share\\does-not-exist-xyz.js', 'vim', onError)

      expect(onError).not.toHaveBeenCalled()
    })
  }
})
