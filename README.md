# triple

[REPL](http://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) for Titanium. Inspired heavily by node.js's own [repl](http://nodejs.org/api/repl.html).

![demo](http://cl.ly/image/0a0z1F2N342H/triple3.gif)

## Features

* Full access to [Titanium API](http://docs.appcelerator.com/titanium/latest/#!/api)
* Command history (&uarr;,&darr;)
* Multi-line statements
* Color-coded return values, by type
* Much more coming (see [enhancements](https://github.com/tonylukasavage/triple/issues?labels=enhancement&milestone=&page=1&state=open))

## Install [![NPM version](https://badge.fury.io/js/triple.svg)](http://badge.fury.io/js/triple)

```bash
$ npm install -g triple
```

## Usage

```bash
$ triple
[creating app]
[loading app]
> alert('hello, world!');
```

### Triple commands

Triple includes a few commands to control its operations. These must be preceded by the dot (.) to be recognized as commands.

 * `.exit` -- exits the REPL
 * `.save [option_file_name]` -- saves your history to ./triple.log or the specified file name. The history is _not_ cleared after a save.


## Support

The following is the only configuration for which this has been tested so far:

* Mac OSX 10.9.4
* iOS 7.1 + simulator
* Titanium SDK 3.2.3+

Support for all of Appcelerator's supported platforms is planned. Windows OS support is planned as well.

## Known Issues

### `this.Kroll`

Trying to inspect `this.Kroll` on iOS will cause a fatal error. This is due to the fact that `this.Kroll` is not a genuine Javascript object. It will be skipped if your inspect `this`, and it will crash the app if you try to inspect it directly.
