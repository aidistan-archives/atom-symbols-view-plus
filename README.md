# Symbols View Plus package

An alternative to [atom/symbols-view](https://atom.io/packages/symbols-view)

## Roadmap

- [x] Generate project symbols
- [x] Provide service for autocomplete-plus
- [x] Sidebar-style symbol list

## Features

- Generate project symbols
  - Provide a command to generate the tag file of whole project
  - Update the project tag file incrementally on file save
  - Allow user to add extra ctag command arguments

## Usage

Basic usage is the same as [atom/symbols-view](https://atom.io/packages/symbols-view).

### Project Symbols

To generate project symbols manually, type `generate project symbols` in the Command Palette (`ctrl+shift+p` or `cmd+shift+p`) and press `Enter`. A *.tags* file will appear at the root of your project in a few seconds and you may want to [gitignore *.tags* files globally](https://help.github.com/articles/ignoring-files/#create-a-global-gitignore).

## License

[The MIT License](https://github.com/aidistan/atom-symbols-view-plus/blob/master/LICENSE.md)

## References

- [atom/symbols-view](https://github.com/atom/symbols-view) : Jump to symbols in Atom
- [atom/autocomplete-plus](https://github.com/atom/autocomplete-plus) : View and insert possible completions in the editor while typing
- [yongkangchen/atom-ctags](https://github.com/yongkangchen/atom-ctags) : Better autocomplete for atom, using ctags
- [7ute/symbols-list](https://github.com/7ute/symbols-list) : An alternate symbol list sidebar for Atom.io text editor
- [xndcn/symbols-tree-view](https://github.com/xndcn/symbols-tree-view) : A symbols view like taglist for Atom.io
