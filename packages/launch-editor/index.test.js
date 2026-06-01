const assert = require('node:assert/strict')
const { describe, test, mock } = require('node:test')

const launchEditor = require('./index.js')

const UNC_ERROR = 'UNC paths are not supported on Windows to avoid security issues.'

describe('launchEditor UNC path guard', () => {
  if (process.platform === 'win32') {
    test('rejects UNC paths on Windows via the error callback', () => {
      const onError = mock.fn()

      launchEditor('\\\\server\\share\\file.js', 'vim', onError)

      assert.equal(onError.mock.callCount(), 1)
      const [fileName, message] = onError.mock.calls[0].arguments
      assert.equal(fileName, '\\\\server\\share\\file.js')
      assert.ok(message.includes(UNC_ERROR))
    })

    test('strips the position suffix before reporting the rejected UNC path', () => {
      const onError = mock.fn()

      launchEditor('\\\\server\\share\\file.js:10:5', 'vim', onError)

      assert.equal(onError.mock.callCount(), 1)
      const [fileName, message] = onError.mock.calls[0].arguments
      assert.equal(fileName, '\\\\server\\share\\file.js')
      assert.ok(message.includes(UNC_ERROR))
    })

    test('does not treat a normal absolute Windows path as UNC', () => {
      const onError = mock.fn()

      // Non-existent file: without the UNC guard firing, launchEditor returns
      // silently at the `fs.existsSync` check without invoking the callback.
      launchEditor('C:\\Users\\me\\does-not-exist-xyz.js', 'vim', onError)

      assert.equal(onError.mock.callCount(), 0)
    })
  } else {
    test('does not apply the UNC guard on non-Windows platforms', () => {
      const onError = mock.fn()

      launchEditor('\\\\server\\share\\does-not-exist-xyz.js', 'vim', onError)

      assert.equal(onError.mock.callCount(), 0)
    })
  }
})
