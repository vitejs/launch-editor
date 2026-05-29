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

See [`index.d.ts`](./index.d.ts) for the full type definitions and the available arguments.

## Custom editor support

This package infers the editor from currently running processes. You can override that behavior with the `LAUNCH_EDITOR` environment variable to force a specific editor or run a custom launch script. See the [`launch-editor` README](https://github.com/vitejs/launch-editor#custom-editor-support) for details.
