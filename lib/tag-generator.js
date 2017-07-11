/** @babel */

import { BufferedProcess, Point } from 'atom';
import path from 'path';
import fs from 'fs-plus';

export default class TagGenerator {
  constructor(path1, scopeName) {
    const packageRoot = this.getPackageRoot();
    this.path = path1;
    this.scopeName = scopeName;
    this.command = path.join(packageRoot, 'vendor', `ctags-${process.platform}`);
    this.args = [`--options=${path.join(packageRoot, 'lib', 'ctags-config')}`];
    this.options = {};

    const extraCommandArguments =
      atom.config.get('symbols-view-plus.plusConfigurations.extraCommandArguments');
    if (extraCommandArguments != '') {
      this.args.push(extraCommandArguments);
    }

    this.args.push('--fields=+K');

    const projectRoot = this.getProjectRoot();
    if (projectRoot) {
      this.options.cwd = projectRoot;
    }
  }

  getPackageRoot() {
    const {resourcePath} = atom.getLoadSettings();
    const currentFileWasRequiredFromSnapshot = !fs.isAbsolute(__dirname);
    if (currentFileWasRequiredFromSnapshot) {
      return path.join(resourcePath, 'node_modules', 'symbols-view-plus');
    } else {
      const packageRoot = path.resolve(__dirname, '..');
      if (path.extname(resourcePath) === '.asar') {
        if (packageRoot.indexOf(resourcePath) === 0) {
          return path.join(`${resourcePath}.unpacked`, 'node_modules', 'symbols-view-plus');
        }
      }
      return packageRoot;
    }
  }

  getProjectRoot() {
    for (let directory of atom.project.getDirectories()) {
      const dirPath = directory.getPath();
      if (dirPath == this.path || directory.contains(this.path)) {
        return dirPath;
      }
    }
    return null;
  }

  parseTagLine(line) {
    let sections = line.split('\t');

    if (sections.length > 3) {
      return {
        position: new Point(parseInt(sections[2], 10) - 1),
        name: sections[0],
        kind: sections[3],
        parent: sections[4],
      };
    } else {
      return null;
    }
  }

  parseErrorLines(lines) {
    lines = lines.split(/\n|\r\n/)
      // Ignore warnings
      .filter((line) => !line.match(/ctags-(darwin|linux|win32): Warning: /))
      // Ignore empty lines
      .filter((line) => line != '');

    if (lines.length > 0) {
      atom.notifications.addError(
        `Error${lines.length > 1 ? 's' : ''} detected during the generation`,
        { detail: lines.join('\n'), dismissable: true }
      );
    }

    return lines;
  }

  getLanguage() {
    if (['.cson', '.gyp'].includes(path.extname(this.path))) {
      return 'Cson';
    }

    switch (this.scopeName) {
      case 'source.c':                 return 'C';
      case 'source.cpp':               return 'C++';
      case 'source.clojure':           return 'Lisp';
      case 'source.capnp':             return 'Capnp';
      case 'source.cfscript':          return 'ColdFusion';
      case 'source.cfscript.embedded': return 'ColdFusion';
      case 'source.coffee':            return 'CoffeeScript';
      case 'source.css':               return 'Css';
      case 'source.css.less':          return 'Css';
      case 'source.css.scss':          return 'Css';
      case 'source.elixir':            return 'Elixir';
      case 'source.fountain':          return 'Fountain';
      case 'source.gfm':               return 'Markdown';
      case 'source.go':                return 'Go';
      case 'source.java':              return 'Java';
      case 'source.js':                return 'JavaScript';
      case 'source.js.jsx':            return 'JavaScript';
      case 'source.jsx':               return 'JavaScript';
      case 'source.json':              return 'Json';
      case 'source.julia':             return 'Julia';
      case 'source.makefile':          return 'Make';
      case 'source.objc':              return 'C';
      case 'source.objcpp':            return 'C++';
      case 'source.python':            return 'Python';
      case 'source.ruby':              return 'Ruby';
      case 'source.sass':              return 'Sass';
      case 'source.yaml':              return 'Yaml';
      case 'text.html':                return 'Html';
      case 'text.html.php':            return 'Php';
      case 'text.tex.latex':           return 'Latex';
      case 'text.html.cfml':           return 'ColdFusion';
    }
    return undefined;
  }

  wrapBusySignal(title, promise) {
    const _package = atom.packages.getActivePackage('symbols-view-plus');
    const provider = _package ? _package.mainModule.busySignalConsumer : null;

    if (provider) {
      provider.add(title);
      return promise.then((res) => {
        provider.remove(title);
        return res;
      });
    } else {
      return promise;
    }
  }

  // NOTE: to be compatible with atom/symbols-view
  generate() {
    return this.generateFileSymbols();
  }

  generateFileSymbols() {
    const args = Array.from(this.args);

    if (atom.config.get('symbols-view-plus.originalConfigurations.useEditorGrammarAsCtagsLanguage')) {
      const language = this.getLanguage();
      if (language) {
        args.push(`--language-force=${language}`);
      }
    }

    args.push('-n', '-o', '-', this.path);

    return this.wrapBusySignal('Generate file symbols', new Promise((resolve, reject) => {
      let tags = {};
      return new BufferedProcess({
        command: this.command,
        args,
        options: this.options,
        stdout: (lines) => {
          let result = [];
          for (const line of Array.from(lines.split(/\n|\r\n/))) {
            let tag, item;
            if (tag = this.parseTagLine(line)) {
              item = tags[tag.position.row] || (tags[tag.position.row] = tag);
            }
            result.push(item);
          }
          return result;
        },
        stderr: (lines) => {
          lines = this.parseErrorLines(lines);
          if (lines.length > 0) { reject(new Error(lines.join('\n'))); }
        },
        exit: () => {
          let result = [];

          for (const row in tags) {
            result.push(tags[row]);
          }

          resolve(result);

          if (atom.config.get('symbols-view-plus.plusConfigurations.updateProjectTagsAfterTogglingFileSymbols')) {
            if (this.options.cwd) {
              for (let i = 1; i <= 4; i += 1) { args.pop(); }
              args.push('--append=yes', '-o', '.tags', this.path);

              return new BufferedProcess({
                command: this.command,
                args,
                options: this.options,
              });
            }
          }

          return null;
        },
      });
    })
    .catch(() => []));
  }

  generateProjectSymbols() {
    const _args = Array.from(this.args);

    const extraCommandArgumentsWhenGeneratingProjectSymbols =
      atom.config.get('symbols-view-plus.plusConfigurations.extraCommandArgumentsWhenGeneratingProjectSymbols');
    if (extraCommandArgumentsWhenGeneratingProjectSymbols != '') {
      _args.push(extraCommandArgumentsWhenGeneratingProjectSymbols);
    }

    _args.push('-o', '.tags', '-R', './');

    return this.wrapBusySignal('Generate project symbols',
      Promise.all(atom.project.getDirectories().map((directory) => {
        let args = Array.from(_args);
        const options = Array.from(this.options);

        if (!fs.existsSync(directory.resolve('.gitignore'))) {
          args = args.map((arg) => arg.replace('--exclude=@.gitignore', ''));
        }
        args = args.filter((arg) => arg != '');

        options.cwd = directory.getPath();

        return new Promise((resolve, reject) => new BufferedProcess({
          command: this.command,
          args,
          options,
          stderr: (lines) => {
            lines = this.parseErrorLines(lines);
            if (lines.length > 0) { reject(new Error(lines.join('\n'))); }
          },
          exit() { resolve(); },
        }));
      }))
      .then(() => atom.notifications.addSuccess('Project symbols generated successfully'))
      .catch(() => atom.notifications.addError('Failed to generate project symbols'))
    );
  }
}
