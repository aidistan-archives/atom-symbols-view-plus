/** @babel */

import path from 'path';
import { Point } from 'atom';
import SelectListView from 'atom-select-list';
import fs from 'fs-plus';
import { match } from 'fuzzaldrin';

export default class SymbolsView {
  static highlightMatches(context, name, matches, offsetIndex) {
    if (!offsetIndex) {
      offsetIndex = 0;
    }
    let lastIndex = 0;
    let matchedChars = []; // Build up a set of matched chars to be more semantic
    const fragment = document.createDocumentFragment();

    for (let matchIndex of Array.from(matches)) {
      matchIndex -= offsetIndex;
      if (matchIndex < 0) {
        continue; // If marking up the basename, omit name matches
      }
      const unmatched = name.substring(lastIndex, matchIndex);
      if (unmatched) {
        if (matchedChars.length) {
          const span = document.createElement('span');
          span.classList.add('character-match');
          span.textContent = matchedChars.join('');
          fragment.appendChild(span);
        }
        matchedChars = [];
        fragment.appendChild(document.createTextNode(unmatched));
      }
      matchedChars.push(name[matchIndex]);
      lastIndex = matchIndex + 1;
    }

    if (matchedChars.length) {
      const span = document.createElement('span');
      span.classList.add('character-match');
      span.textContent = matchedChars.join('');
      fragment.appendChild(span);
    }

    // Remaining characters are plain text
    fragment.appendChild(document.createTextNode(name.substring(lastIndex)));

    return fragment;
  }

  constructor(stack, emptyMessage = 'No symbols found', maxResults = null) {
    this.stack = stack;
    this.selectListView = new SelectListView({
      maxResults,
      emptyMessage,
      items: [],
      filterKeyForItem: (item) => item.name,
      elementForItem: this.elementForItem.bind(this),
      didChangeSelection: this.didChangeSelection.bind(this),
      didConfirmSelection: this.didConfirmSelection.bind(this),
      didConfirmEmptySelection: this.didConfirmEmptySelection.bind(this),
      didCancelSelection: this.didCancelSelection.bind(this),
    });
    this.theme = atom.config.get('symbols-view-plus.plusConfigurations.symbolsViewTheme').split(' ')[0].toLowerCase();
    this.element = this.selectListView.element;
    this.element.classList.add('symbols-view-plus');
    this.element.classList.add(`symbols-view-plus--${this.theme}`);

    switch (this.theme) {
      case 'right':
        this.panel = atom.workspace.addRightPanel({item: this, visible: false});
        break;
      case 'modal':
        this.panel = atom.workspace.addModalPanel({item: this, visible: false});
        break;
      default:
        this.item = {
          element: this.element,
          getTitle: () => 'Symbols View',
          getURI: () => 'atom://symbols-view-plus/symbols-view',
          getDefaultLocation: () => 'right',
        };
    }
  }

  async destroy() {
    await this.cancel();
    this.theme == 'dock' ? atom.workspace.hide(this.item) : this.panel.destroy();
    return this.selectListView.destroy();
  }

  getFilterKey() {
    return 'name';
  }

  elementForItem({position, name, kind, file, directory}) {
    // Style matched characters in search results
    const matches = match(name, this.selectListView.getFilterQuery());

    if (atom.project.getPaths().length > 1) {
      file = path.join(path.basename(directory), file);
    }

    if (this.theme === 'modal') {
      const li = document.createElement('li');
      li.classList.add('two-lines');

      const primaryLine = document.createElement('div');
      primaryLine.classList.add('primary-line');
      if (position) {
        primaryLine.textContent = `${name}:${position.row + 1}`;
      } else {
        primaryLine.appendChild(SymbolsView.highlightMatches(this, name, matches));
      }
      li.appendChild(primaryLine);

      const secondaryLine = document.createElement('div');
      secondaryLine.classList.add('secondary-line');
      secondaryLine.textContent = file.replace(directory, '');
      li.appendChild(secondaryLine);

      return li;
    } else {
      const li = document.createElement('li');
      li.classList.add('two-lines');

      const primaryLine = document.createElement('div');
      primaryLine.classList.add('primary-line');
      li.appendChild(primaryLine);

      const icon = document.createElement('span');
      icon.classList.add('icon');
      icon.classList.add(`icon-${kind.replace(' ', '-')}`);
      primaryLine.appendChild(icon);

      const match = document.createElement('span');
      if (position) {
        match.textContent = `${name}:${position.row + 1}`;
      } else {
        match.appendChild(SymbolsView.highlightMatches(this, name, matches));
      }
      primaryLine.appendChild(match);

      const secondaryLine = document.createElement('div');
      secondaryLine.classList.add('secondary-line');
      secondaryLine.textContent = file.replace(directory, '');
      li.appendChild(secondaryLine);

      return li;

    }
  }

  async cancel() {
    if (!this.isCanceling) {
      this.isCanceling = true;
      await this.selectListView.update({items: []});
      this.theme == 'dock' ? atom.workspace.hide(this.item) : this.panel.hide();
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
      }
      this.isCanceling = false;
    }
  }

  didCancelSelection() {
    this.cancel();
  }

  didConfirmEmptySelection() {
    this.cancel();
  }

  async didConfirmSelection(tag) {
    if (tag.file && !fs.isFileSync(path.join(tag.directory, tag.file))) {
      await this.selectListView.update({errorMessage: 'Selected file does not exist'});
      setTimeout(() => {
        this.selectListView.update({errorMessage: null});
      }, 2000);
    } else {
      await this.cancel();
      this.openTag(tag);
    }
  }

  didChangeSelection(tag) {
    // no-op
  }

  openTag(tag) {
    const editor = atom.workspace.getActiveTextEditor();
    let previous;
    if (editor) {
      previous = {
        editorId: editor.id,
        position: editor.getCursorBufferPosition(),
        file: editor.getURI(),
      };
    }

    let {position} = tag;
    if (!position) { position = this.getTagLine(tag); }
    if (tag.file) {
      atom.workspace.open(path.join(tag.directory, tag.file)).then(() => {
        if (position) {
          return this.moveToPosition(position);
        }
        return undefined;
      });
    } else if (position && previous && !previous.position.isEqual(position)) {
      this.moveToPosition(position);
    }

    this.stack.push(previous);
  }

  moveToPosition(position, beginningOfLine) {
    const editor = atom.workspace.getActiveTextEditor();
    if (beginningOfLine == null) {
      beginningOfLine = true;
    }
    if (editor) {
      editor.scrollToBufferPosition(position, {center: true});
      editor.setCursorBufferPosition(position);
      if (beginningOfLine) {
        editor.moveToFirstCharacterOfLine();
      }
    }
  }

  attach() {
    this.previouslyFocusedElement = document.activeElement;
    this.theme == 'dock' ? atom.workspace.open(this.item) : this.panel.show();
    this.selectListView.reset();
    this.selectListView.focus();
  }

  getTagLine(tag) {
    // Remove leading /^ and trailing $/
    if (!tag || !tag.pattern) {
      return undefined;
    }
    const pattern = tag.pattern.replace(/(^^\/\^)|(\$\/$)/g, '').trim();

    if (!pattern) {
      return undefined;
    }
    const file = path.join(tag.directory, tag.file);
    if (!fs.isFileSync(file)) {
      return undefined;
    }
    const iterable = fs.readFileSync(file, 'utf8').split(/\n|\r\n/);
    for (let index = 0; index < iterable.length; index++) {
      let line = iterable[index];
      if (pattern === line.trim()) {
        return new Point(index, 0);
      }
    }

    return undefined;
  }
}
