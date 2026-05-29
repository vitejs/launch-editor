# launch-editor-middleware

An express/connect/webpack-dev-server compatible middleware for opening files in your editor from the browser, powered by [`launch-editor`](https://github.com/vitejs/launch-editor#readme).

## Usage

```js
const launchMiddleware = require('launch-editor-middleware')

app.use('/__open-in-editor', launchMiddleware())
```

To launch files, send requests to the server like the following:

```text
/__open-in-editor?file=src/main.js:13:24
```

Both the line and column numbers are optional. `file://` URIs are also supported.

## API

```js
launchMiddleware(specifiedEditor?, srcRoot?, onErrorCallback?)
```

The factory function accepts the following arguments (all optional, the callback can be in any position as long as it's the last argument):

1. **`specifiedEditor`** — A specific editor bin to try first. Defaults to inferring from running processes, then falling back to env variables like `EDITOR` and `VISUAL`. See the [list of supported editors](https://github.com/vitejs/launch-editor#supported-editors).
2. **`srcRoot`** — The root directory of source files, in case the file path is relative. Defaults to `process.cwd()`.
3. **`onErrorCallback`** — A callback invoked when it fails to launch the editor, called with `(fileName, errorMessage)`.

## Custom editor support

This package infers the editor from currently running processes. You can override that behavior with the `LAUNCH_EDITOR` environment variable to force a specific editor or run a custom launch script. See the [`launch-editor` README](https://github.com/vitejs/launch-editor#custom-editor-support) for details.
