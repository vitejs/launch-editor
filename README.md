# launch-editor

Open file with line numbers in editor from Node.js.

The main functionality is extracted from [react-dev-utils](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-dev-utils/launchEditor.js) with slight modifications so that it can be used as a standalone package. The original source code is licensed under MIT.

Also added column number support.

## Why

There are also a few other existing packages with the same purpose:

- [lahmatiy/open-in-editor](https://github.com/lahmatiy/open-in-editor)
- [sindresorhus/open-editor](https://github.com/sindresorhus/open-editor)

However, both expects env variables like `EDITOR` to be set in order to open files. This package infers the editor to open by checking current running processes before falling back to env variables.

On the other hand,`react-dev-utils` includes many other utilities and dependencies and is thus not suitable for standalone usage.

## Usage

```js
const launch = require('launch-editor')

launch(
  // filename:line:column
  // both line and column are optional
  // `file://` URIs are also supported
  'foo.js:12:34',
  // try specific editor bin first (optional)
  'code',
  // callback if failed to launch (optional)
  (fileName, errorMsg) => {
    // log error if any
  }
)
```

### Middleware

An express/connect/webpack-dev-server compatible middleware is also available:

``` js
const launchMiddleware = require('launch-editor-middleware')

app.use('/__open-in-editor', launchMiddleware())
```

The middleware factory function accepts the following arguments (all optional, the callback can be in any position as long as it's the last argument):

1. A specific editor bin to try first. Defaults to inferring from running processes, then fallback to env variables like `EDITOR` and `VISUAL`.
2. The root directory of source files, in case the file path is relative. Defaults to `process.cwd()`.
3. a callback when it fails to launch the editor.

To launch files, send requests to the server like the following:

```text
/__open-in-editor?file=src/main.js:13:24
```

### Supported editors

| Value           | Editor                                                                 | Linux | Windows | macOS |
| --------------- | ---------------------------------------------------------------------- | :---: | :-----: |  :-:  |
| `appcode`       | [AppCode](https://www.jetbrains.com/objc/)                             |       |         |   ✓   |
| `atom`          | [Atom](https://atom.io/)                                               |  ✓    |   ✓     |   ✓   |
| `atom-beta`     | [Atom Beta](https://atom.io/beta)                                      |       |         |   ✓   |
| `brackets`      | [Brackets](http://brackets.io/)                                        |  ✓    |   ✓     |   ✓   |
| `clion`         | [Clion](https://www.jetbrains.com/clion/)                              |       |   ✓     |   ✓   |
| `code`          | [Visual Studio Code](https://code.visualstudio.com/)                   |  ✓    |   ✓     |   ✓   |
| `code-insiders` | [Visual Studio Code Insiders](https://code.visualstudio.com/insiders/) |  ✓    |   ✓     |   ✓   |
| `codium`        | [VSCodium](https://github.com/VSCodium/vscodium)                       |  ✓    |   ✓     |   ✓   |
| `cursor`        | [Cursor](https://www.cursor.com/)                                      |  ✓    |   ✓     |   ✓   |
| `emacs`         | [Emacs](https://www.gnu.org/software/emacs/)                           |  ✓    |         |       |
| `idea`          | [IDEA](https://www.jetbrains.com/idea/)                                |  ✓    |   ✓     |   ✓   |
| `notepad++`     | [Notepad++](https://notepad-plus-plus.org/download/v7.5.4.html)        |       |   ✓     |       |
| `nova`          | [Nova](https://nova.app)        |       |         |   ✓   |
| `pycharm`       | [PyCharm](https://www.jetbrains.com/pycharm/)                          |  ✓    |   ✓     |   ✓   |
| `phpstorm`      | [PhpStorm](https://www.jetbrains.com/phpstorm/)                        |  ✓    |   ✓     |   ✓   |
| `rider`         | [Rider](https://www.jetbrains.com/rider/)                              |  ✓    |   ✓     |   ✓   |
| `rubymine`      | [RubyMine](https://www.jetbrains.com/ruby/)                            |  ✓    |   ✓     |   ✓   |
| `sublime`       | [Sublime Text](https://www.sublimetext.com/)                           |  ✓    |   ✓     |   ✓   |
| `vim`           | [Vim](http://www.vim.org/)                                             |  ✓    |         |       |
| `visualstudio`  | [Visual Studio](https://www.visualstudio.com/vs/)                      |       |         |   ✓   |
| `webstorm`      | [WebStorm](https://www.jetbrains.com/webstorm/)                        |  ✓    |   ✓     |   ✓   |
| `zed`           | [Zed](https://zed.dev/)                                                |  ✓    |   ✓     |   ✓   |

### Custom editor support

You can use the `LAUNCH_EDITOR` environment variable

#### to force a specific supported editor

```bash
LAUNCH_EDITOR=codium
```

#### to run a custom launch script

```bash
LAUNCH_EDITOR=my-editor-launcher.sh
```

```shell
# gets called with 3 args: filename, line, column
filename=$1
line=$2
column=$3

# call your editor with whatever args it expects
my-editor -l $line -c $column -f $filename
```
