/** @babel */

import { CompositeDisposable } from 'atom';
import TagGenerator from '../tag-generator';

export default class OnFileChangeUpdater {
  constructor() {
    this.toggle(atom.config.get(
      'symbols-view-plus.plusConfigurations.updateProjectTagsOnFileChange'
    ));
    atom.config.observe(
      'symbols-view-plus.plusConfigurations.updateProjectTagsOnFileChange',
      (newValue) => this.toggle(newValue)
    );
  }

  toggle(newVal) {
    newVal ? this.enable() : this.disable();
  }

  enable() {
    if (this.editorsSubscription) { return; }

    this.editorsSubscription = atom.workspace.observeTextEditors((editor) => {
      const generateFileSymbols = () => new TagGenerator(
        editor.getPath(),
        editor.getGrammar() && editor.getGrammar().scopeName
      ).generateFileSymbols();

      const generateProjectSymbols = () => new TagGenerator(
        null
      ).generateProjectSymbols();

      const editorSubscriptions = new CompositeDisposable();
      editorSubscriptions.add(editor.onDidChangeGrammar(generateFileSymbols));
      editorSubscriptions.add(editor.onDidSave(generateFileSymbols));
      editorSubscriptions.add(editor.onDidChangePath(generateProjectSymbols));
      editorSubscriptions.add(editor.getBuffer().onDidReload(generateFileSymbols));
      editorSubscriptions.add(editor.getBuffer().onDidDestroy(generateProjectSymbols));
      editor.onDidDestroy(() => editorSubscriptions.dispose());
    });
  }

  disable() {
    if (this.editorsSubscription) {
      this.editorsSubscription.dispose();
      this.editorsSubscription = null;
    }
  }
}
