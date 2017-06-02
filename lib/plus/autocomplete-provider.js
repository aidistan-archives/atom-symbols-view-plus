/** @babel */

import { CompositeDisposable, File } from 'atom';
import { filter } from 'fuzzaldrin';
import TagReader from '../tag-reader';
import getTagsFile from '../get-tags-file';

export default class AutocompleteProvider {
  constructor() {
    this.tags = [];
    this.startTask();
  }

  startTask() {
    this.loadTagsTask = TagReader.getAllTags((tags) => {
      this.tags = tags;
      this.loadTagsTask = null;
    });
    this.watchTagsFiles();
  }

  restartTask() {
    if (this.loadTagsTask) {
      this.loadTagsTask.terminate();
    }
    this.startTask();
  }

  watchTagsFiles() {
    this.unwatchTagsFiles();
    this.tagsFileSubscriptions = new CompositeDisposable();

    for (let projectPath of atom.project.getPaths()) {
      let tagsFilePath = getTagsFile(projectPath);
      if (tagsFilePath) {
        const tagsFile = new File(tagsFilePath);
        this.tagsFileSubscriptions.add(tagsFile.onDidChange(this.restartTask));
        this.tagsFileSubscriptions.add(tagsFile.onDidDelete(this.restartTask));
        this.tagsFileSubscriptions.add(tagsFile.onDidRename(this.restartTask));
      }
    }
  }

  unwatchTagsFiles() {
    if (this.tagsFileSubscriptions) {
      this.tagsFileSubscriptions.dispose();
      this.tagsFileSubscriptions = null;
    }
  }

  selector: '*'

  maxResults: 5
  inclusionPriority: 1
  excludeLowerPriority: false

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    let leftLabel, snippet, rightLabel;

    // Check the service status
    if (!atom.config.get('symbols-view-plus.plusConfigurations.provideServiceForAutocomplete')) { return null; }

    // Check the prefix length
    const minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength');
    if (!minimumWordLength || prefix.length < minimumWordLength) { return null; }

    return filter(this.tags, prefix, {key: 'name', maxResults: this.maxResults}).map((tag) => {
      // Get rid of "/^" and "$/"
      const patternStr = tag.pattern.substring(2, tag.pattern.length - 2);

      // Try to make a snippet
      if (atom.config.get('symbols-view-plus.plusConfigurations.provideArgumentsForAutocomplete'))        {
        if (tag.kind === 'require') {
          snippet = patternStr;
        } else if (tag.kind === 'function') {
          // Get the return type
          leftLabel = patternStr.substring(0, patternStr.indexOf(tag.name) - 1);
          // Get rid of any chars before the symbol
          snippet = patternStr.substring(patternStr.indexOf(tag.name), patternStr.length);
          // Get rid of the brace at line end if exists
          snippet = snippet.replace(/\s*{\s*/, '');
        }
      }

      rightLabel = tag.kind;

      return {
        text: tag.name,
        type: tag.kind,
        description: tag.file,
        leftLabel, snippet, rightLabel,
      };
    });
  }
}
