# Symbols View Plus package

[![Build Status](https://travis-ci.org/aidistan/atom-symbols-view-plus.svg?branch=master)](https://travis-ci.org/aidistan/atom-symbols-view-plus)
[![Build status](https://ci.appveyor.com/api/projects/status/xwvan82oo42t6qmu?svg=true)](https://ci.appveyor.com/project/aidistan/atom-symbols-view-plus)

An alternative to [atom/symbols-view](https://atom.io/packages/symbols-view)

**Due to [atom/apm#575](https://github.com/atom/apm/issues/575), please use `apm install aidistan/atom-symbols-view-plus` to install this package.**

## Features

- Generate project symbols
  - Provide a command to generate the tag file of whole project
  - Update the project tag file incrementally on file save
  - Allow user to add extra ctag command arguments
- Provide service for autocomplete-plus
  - Project symbols are provided for autocomplete-plus automatically
- Provide a new theme of symbols view
  - Right-sidebar theme now works as default

## Usage

Basic usage is the same as [atom/symbols-view](https://atom.io/packages/symbols-view), which should be familiar to all Atom users.

To generate project symbols, type `generate project symbols` in the Command Palette (`ctrl+shift+p` or `cmd+shift+p`) and press `Enter`. A *.tags* file will be generated at the root of your project in a few seconds and you may want to [gitignore *.tags* files globally](https://help.github.com/articles/ignoring-files/#create-a-global-gitignore).

## License

[The MIT License](https://github.com/aidistan/atom-symbols-view-plus/blob/master/LICENSE.md)

## References

- [atom/symbols-view](https://github.com/atom/symbols-view) : Jump to symbols in Atom
- [atom/autocomplete-plus](https://github.com/atom/autocomplete-plus) : View and insert possible completions in the editor while typing
- [yongkangchen/atom-ctags](https://github.com/yongkangchen/atom-ctags) : Better autocomplete for atom, using ctags
- [7ute/symbols-list](https://github.com/7ute/symbols-list) : An alternate symbol list sidebar for Atom.io text editor
- [xndcn/symbols-tree-view](https://github.com/xndcn/symbols-tree-view) : A symbols view like taglist for Atom.io
